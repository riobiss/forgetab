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
    try {
      return await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
        SELECT
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
          COALESCE(identity, '{}'::jsonb) AS identity,
          COALESCE(characteristics, '{}'::jsonb) AS characteristics,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          ${buildVisibilityCondition(isOwner, userId)}
        ORDER BY created_at DESC
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "race_key" does not exist') ||
          error.message.includes('column "class_key" does not exist') ||
          error.message.includes('column "max_carry_weight" does not exist') ||
          error.message.includes('column "current_statuses" does not exist') ||
          error.message.includes('column "identity" does not exist') ||
          error.message.includes('column "characteristics" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_label" does not exist') ||
          error.message.includes('column "progression_required" does not exist') ||
          error.message.includes('column "progression_current" does not exist'))
      ) {
        return prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
          SELECT
            id,
            rpg_id AS "rpgId",
            name,
            null::text AS "image",
            null::text AS "raceKey",
            null::text AS "classKey",
            character_type AS "characterType",
            visibility,
            null::double precision AS "maxCarryWeight",
            'xp_level'::text AS "progressionMode",
            'Level 1'::text AS "progressionLabel",
            0::integer AS "progressionRequired",
            0::integer AS "progressionCurrent",
            created_by_user_id AS "createdByUserId",
            life,
            defense,
            mana,
            stamina AS exhaustion,
            sanity,
            statuses,
            '{}'::jsonb AS "currentStatuses",
            attributes,
            skills,
            '{}'::jsonb AS identity,
            '{}'::jsonb AS characteristics,
            created_at AS "createdAt",
            updated_at AS "updatedAt"
          FROM rpg_characters
          WHERE rpg_id = ${rpgId}
            ${buildVisibilityCondition(isOwner, userId)}
          ORDER BY created_at DESC
        `)
      }
      throw error
    }
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
        'public'::"RpgVisibility",
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
