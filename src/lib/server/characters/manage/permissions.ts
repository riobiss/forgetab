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
  let rpgRows: Array<{
    id: string
    ownerId: string
    useInventoryWeightLimit: boolean
    progressionMode: string
    progressionTiers: Prisma.JsonValue
  }> = []

  try {
    rpgRows = await prisma.$queryRaw<
      Array<{
        id: string
        ownerId: string
        useInventoryWeightLimit: boolean
        progressionMode: string
        progressionTiers: Prisma.JsonValue
      }>
    >(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit",
        COALESCE(progression_mode, 'xp_level') AS "progressionMode",
        COALESCE(progression_tiers, '[{"label":"Level 1","required":0}]'::jsonb) AS "progressionTiers"
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (!error.message.includes('column "use_inventory_weight_limit" does not exist') &&
        !error.message.includes('column "progression_mode" does not exist') &&
        !error.message.includes('column "progression_tiers" does not exist'))
    ) {
      throw error
    }

    rpgRows = await prisma.$queryRaw<
      Array<{
        id: string
        ownerId: string
        useInventoryWeightLimit: boolean
        progressionMode: string
        progressionTiers: Prisma.JsonValue
      }>
    >(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        false AS "useInventoryWeightLimit",
        'xp_level'::text AS "progressionMode",
        '[{"label":"Level 1","required":0}]'::jsonb AS "progressionTiers"
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)
  }

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
  let character: Array<{
    id: string
    characterType: "player" | "npc" | "monster"
    createdByUserId: string | null
    skills: Prisma.JsonValue
    currentStatuses: Prisma.JsonValue
    identity: Prisma.JsonValue
    characteristics: Prisma.JsonValue
    progressionCurrent: number
  }> = []

  try {
    character = await prisma.$queryRaw<
      Array<{
        id: string
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
        id,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId",
        skills,
        COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses",
        COALESCE(identity, '{}'::jsonb) AS identity,
        COALESCE(characteristics, '{}'::jsonb) AS characteristics,
        COALESCE(progression_current, 0) AS "progressionCurrent"
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
  } catch (error) {
    if (
      !(error instanceof Error) ||
      (!error.message.includes('column "identity" does not exist') &&
        !error.message.includes('column "characteristics" does not exist') &&
        !error.message.includes('column "current_statuses" does not exist') &&
        !error.message.includes('column "progression_current" does not exist'))
    ) {
      throw error
    }

    character = await prisma.$queryRaw<
      Array<{
        id: string
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
        id,
        character_type AS "characterType",
        created_by_user_id AS "createdByUserId",
        skills,
        '{}'::jsonb AS "currentStatuses",
        '{}'::jsonb AS identity,
        '{}'::jsonb AS characteristics,
        0::integer AS "progressionCurrent"
      FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
  }

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
    characterType: character[0].characterType,
    currentSkills: character[0].skills,
    currentCurrentStatuses: character[0].currentStatuses,
    currentIdentity: character[0].identity,
    currentCharacteristics: character[0].characteristics,
    currentProgressionCurrent: character[0].progressionCurrent,
  }
}
