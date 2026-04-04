import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import {
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
} from "@/lib/rpg/progression"

type CanManageCharacterResult =
  | {
      ok: false
      status: number
      message: string
    }
  | {
      ok: true
      isOwner: boolean
      rpgOwnerId: string
      characterCreatedByUserId: string | null
      useInventoryWeightLimit: boolean
      progressionMode: ProgressionMode
      progressionTiers: Array<{ label: string; required: number }>
      currentName: string
      characterType: "player" | "npc" | "monster"
      currentSkills: Prisma.JsonValue
      currentCurrentStatuses: Prisma.JsonValue
      currentIdentity: Prisma.JsonValue
      currentCharacteristics: Prisma.JsonValue
      currentProgressionCurrent: number
    }

export async function canManageCharacter(
  rpgId: string,
  characterId: string,
  userId: string,
): Promise<CanManageCharacterResult> {
  const rpgRows = await prisma.$queryRaw<
    Array<{
      id: string
      ownerId: string
      useInventoryWeightLimit: boolean
      progressionMode: string
      progressionTiers: Prisma.JsonValue
    }>
  >(Prisma.sql`
    SELECT
      r.id,
      r.owner_id AS "ownerId",
      CASE
        WHEN jsonb_typeof(rpg_meta.rpg_json -> 'use_inventory_weight_limit') = 'boolean'
          THEN COALESCE((rpg_meta.rpg_json ->> 'use_inventory_weight_limit')::boolean, false)
        ELSE false
      END AS "useInventoryWeightLimit",
      COALESCE(NULLIF(rpg_meta.rpg_json ->> 'progression_mode', ''), 'xp_level') AS "progressionMode",
      COALESCE(
        rpg_meta.rpg_json -> 'progression_tiers',
        '[{"label":"Level 1","required":0}]'::jsonb
      ) AS "progressionTiers"
    FROM rpgs r
    CROSS JOIN LATERAL (
      SELECT to_jsonb(r) AS rpg_json
    ) rpg_meta
    WHERE r.id = ${rpgId}
    LIMIT 1
  `)

  const rpg = rpgRows[0]
  const progressionMode = isProgressionMode(rpg?.progressionMode)
    ? rpg.progressionMode
    : ("xp_level" as ProgressionMode)
  const progressionTiers = normalizeProgressionTiers(rpg?.progressionTiers, progressionMode)

  if (!rpg) {
    return { ok: false, status: 404, message: "RPG nao encontrado." }
  }

  const isOwner = rpg.ownerId === userId
  let isModerator = false
  if (!isOwner) {
    const membership = await prisma.$queryRaw<Array<{ status: string; role: string }>>(Prisma.sql`
      SELECT status::text AS status, role::text AS role
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)
    if (membership[0]?.status !== "accepted") {
      return { ok: false, status: 404, message: "RPG nao encontrado." }
    }
    isModerator = membership[0]?.role === "moderator"
  }

  const canManageAsMaster = isOwner || isModerator
  const character = await prisma.$queryRaw<
    Array<{
      id: string
      name: string
      characterType: "player" | "npc" | "monster"
      createdByUserId: string | null
      skills: Prisma.JsonValue
      currentStatuses: Prisma.JsonValue
      identity: Prisma.JsonValue
      characteristics: Prisma.JsonValue
      progressionCurrent: number
    }>
  >(Prisma.sql`
    SELECT
      c.id,
      c.name,
      c.character_type AS "characterType",
      c.created_by_user_id AS "createdByUserId",
      c.skills,
      COALESCE(character_meta.character_json -> 'current_statuses', '{}'::jsonb) AS "currentStatuses",
      COALESCE(character_meta.character_json -> 'identity', '{}'::jsonb) AS identity,
      COALESCE(character_meta.character_json -> 'characteristics', '{}'::jsonb) AS characteristics,
      CASE
        WHEN jsonb_typeof(character_meta.character_json -> 'progression_current') IN ('number', 'string')
          THEN COALESCE(NULLIF(character_meta.character_json ->> 'progression_current', '')::integer, 0)
        ELSE 0
      END AS "progressionCurrent"
    FROM rpg_characters c
    CROSS JOIN LATERAL (
      SELECT to_jsonb(c) AS character_json
    ) character_meta
    WHERE c.id = ${characterId}
      AND c.rpg_id = ${rpgId}
    LIMIT 1
  `)

  if (character.length === 0) {
    return { ok: false, status: 404, message: "Personagem nao encontrado." }
  }
  if (!canManageAsMaster && character[0].createdByUserId !== userId) {
    return { ok: false, status: 403, message: "Sem permissao para editar este personagem." }
  }

  return {
    ok: true,
    isOwner: canManageAsMaster,
    rpgOwnerId: rpg.ownerId,
    characterCreatedByUserId: character[0].createdByUserId,
    useInventoryWeightLimit: rpg.useInventoryWeightLimit,
    progressionMode,
    progressionTiers,
    currentName: character[0].name,
    characterType: character[0].characterType,
    currentSkills: character[0].skills,
    currentCurrentStatuses: character[0].currentStatuses,
    currentIdentity: character[0].identity,
    currentCharacteristics: character[0].characteristics,
    currentProgressionCurrent: character[0].progressionCurrent,
  }
}
