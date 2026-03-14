import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { CharacterRow } from "../types"

type ListCharactersInput = {
  rpgId: string
  userId: string
  isOwner: boolean
}

type CreateCharacterRowInput = {
  rpgId: string
  name: string
  image: string | null
  raceKey: string | null
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  visibility: "private" | "public"
  maxCarryWeight: number | null
  progressionMode: string
  progressionLabel: string
  progressionRequired: number
  progressionCurrent: number
  createdByUserId: string | null
  life: number
  defense: number
  mana: number
  exhaustion: number
  sanity: number
  statuses: Record<string, number>
  attributes: Record<string, number>
  skills: Record<string, number>
  identity: Record<string, string>
  characteristics: Record<string, string>
}

export interface CharacterRepository {
  listByRpg(input: ListCharactersInput): Promise<CharacterRow[]>
  countPlayersByCreator(rpgId: string, userId: string): Promise<number>
  create(input: CreateCharacterRowInput): Promise<CharacterRow>
}

const buildVisibilityCondition = (isOwner: boolean, userId: string) =>
  isOwner
    ? Prisma.empty
    : userId
      ? Prisma.sql`AND (visibility = 'public'::"RpgVisibility" OR created_by_user_id = ${userId})`
      : Prisma.sql`AND visibility = 'public'::"RpgVisibility"`

export const prismaCharacterRepository: CharacterRepository = {
  async listByRpg({ rpgId, userId, isOwner }) {
    return prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.rpg_id AS "rpgId",
        c.name,
        character_meta.character_json ->> 'image' AS image,
        character_meta.character_json ->> 'race_key' AS "raceKey",
        character_meta.character_json ->> 'class_key' AS "classKey",
        c.character_type AS "characterType",
        c.visibility,
        CASE
          WHEN jsonb_typeof(character_meta.character_json -> 'max_carry_weight') IN ('number', 'string')
            THEN NULLIF(character_meta.character_json ->> 'max_carry_weight', '')::double precision
          ELSE null::double precision
        END AS "maxCarryWeight",
        COALESCE(NULLIF(character_meta.character_json ->> 'progression_mode', ''), 'xp_level') AS "progressionMode",
        COALESCE(NULLIF(character_meta.character_json ->> 'progression_label', ''), 'Level 1') AS "progressionLabel",
        CASE
          WHEN jsonb_typeof(character_meta.character_json -> 'progression_required') IN ('number', 'string')
            THEN COALESCE(NULLIF(character_meta.character_json ->> 'progression_required', '')::integer, 0)
          ELSE 0
        END AS "progressionRequired",
        CASE
          WHEN jsonb_typeof(character_meta.character_json -> 'progression_current') IN ('number', 'string')
            THEN COALESCE(NULLIF(character_meta.character_json ->> 'progression_current', '')::integer, 0)
          ELSE 0
        END AS "progressionCurrent",
        NULLIF(character_meta.character_json ->> 'created_by_user_id', '') AS "createdByUserId",
        c.life,
        c.defense,
        c.mana,
        c.stamina AS exhaustion,
        c.sanity,
        c.statuses,
        COALESCE(character_meta.character_json -> 'current_statuses', '{}'::jsonb) AS "currentStatuses",
        c.attributes,
        c.skills,
        COALESCE(character_meta.character_json -> 'identity', '{}'::jsonb) AS identity,
        COALESCE(character_meta.character_json -> 'characteristics', '{}'::jsonb) AS characteristics,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt"
      FROM rpg_characters c
      CROSS JOIN LATERAL (
        SELECT to_jsonb(c) AS character_json
      ) character_meta
      WHERE c.rpg_id = ${rpgId}
        ${buildVisibilityCondition(isOwner, userId)}
      ORDER BY c.created_at DESC
    `)
  },

  async countPlayersByCreator(rpgId, userId) {
    const rows = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
        AND character_type = 'player'::"RpgCharacterType"
        AND created_by_user_id = ${userId}
    `)
    return Number(rows[0]?.total ?? 0)
  },

  async create(input) {
    const created = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      INSERT INTO rpg_characters (
        id, rpg_id, name, image, race_key, class_key, character_type, visibility, max_carry_weight, progression_mode, progression_label, progression_required, progression_current, created_by_user_id, life, defense, mana, stamina, sanity, statuses, current_statuses, attributes, skills, identity, characteristics
      )
      VALUES (
        ${crypto.randomUUID()},
        ${input.rpgId},
        ${input.name},
        ${input.image},
        ${input.raceKey},
        ${input.classKey},
        ${input.characterType}::"RpgCharacterType",
        ${input.visibility}::"RpgVisibility",
        ${input.maxCarryWeight},
        ${input.progressionMode},
        ${input.progressionLabel},
        ${input.progressionRequired},
        ${input.progressionCurrent},
        ${input.createdByUserId},
        ${input.life},
        ${input.defense},
        ${input.mana},
        ${input.exhaustion},
        ${input.sanity},
        ${JSON.stringify(input.statuses)}::jsonb,
        ${JSON.stringify(input.statuses)}::jsonb,
        ${JSON.stringify(input.attributes)}::jsonb,
        ${JSON.stringify(input.skills)}::jsonb,
        ${JSON.stringify(input.identity)}::jsonb,
        ${JSON.stringify(input.characteristics)}::jsonb
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        image,
        race_key AS "raceKey",
        class_key AS "classKey",
        character_type AS "characterType",
        visibility,
        max_carry_weight AS "maxCarryWeight",
        COALESCE(progression_mode, 'xp_level') AS "progressionMode",
        COALESCE(progression_label, 'Level 1') AS "progressionLabel",
        COALESCE(progression_required, 0) AS "progressionRequired",
        COALESCE(progression_current, 0) AS "progressionCurrent",
        created_by_user_id AS "createdByUserId",
        life,
        defense,
        mana,
        stamina AS exhaustion,
        sanity,
        statuses,
        COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses",
        attributes,
        skills,
        identity,
        characteristics,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return created[0]
  },
}
