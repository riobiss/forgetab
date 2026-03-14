import type { CharacterDetailRepository } from "@/application/charactersDetail/ports/CharacterDetailRepository"
import type {
  CharacterDetailClassLabelDto,
  CharacterDetailLabelDto,
  CharacterDetailRowDto,
  CharacterDetailRpgDto,
  CharacterDetailTemplateFieldDto,
} from "@/application/charactersDetail/types"
import { prisma } from "@/lib/prisma"
import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import { normalizeRpgVisibility } from "@/infrastructure/shared/normalizeRpgVisibility"
import { Prisma } from "../../../../generated/prisma/client.js"

export const prismaCharacterDetailRepository: CharacterDetailRepository = {
  async getRpg(rpgId: string): Promise<CharacterDetailRpgDto | null> {
    let rpgRow:
      | {
          id: string
          ownerId: string
          visibility: "private" | "public"
          usersCanManageOwnXp: boolean
        }
      | null = null

    try {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string
          ownerId: string
          visibility: "private" | "public"
          usersCanManageOwnXp: boolean
        }>
      >(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          visibility,
          COALESCE(users_can_manage_own_xp, true) AS "usersCanManageOwnXp"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
      rpgRow = rows[0] ?? null
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('column "users_can_manage_own_xp" does not exist')
      ) {
        throw error
      }

      const rows = await prisma.$queryRaw<
        Array<{
          id: string
          ownerId: string
          visibility: "private" | "public"
          usersCanManageOwnXp: boolean
        }>
      >(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          visibility,
          true AS "usersCanManageOwnXp"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
      rpgRow = rows[0] ?? null
    }

    if (!rpgRow) {
      return null
    }

    let progressionMode: ProgressionMode = "xp_level"
    let progressionTiers = getDefaultProgressionTiers("xp_level")

    try {
      const rows = await prisma.$queryRaw<
        Array<{ progressionMode: string; progressionTiers: Prisma.JsonValue }>
      >(Prisma.sql`
        SELECT
          COALESCE(progression_mode, 'xp_level') AS "progressionMode",
          COALESCE(progression_tiers, '[{"label":"Level 1","required":0},{"label":"Level 2","required":100}]'::jsonb) AS "progressionTiers"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)

      progressionMode = isProgressionMode(rows[0]?.progressionMode)
        ? rows[0].progressionMode
        : "xp_level"
      progressionTiers = normalizeProgressionTiers(rows[0]?.progressionTiers, progressionMode)
    } catch (error) {
      if (
        !(error instanceof Error) ||
        (!error.message.includes('column "progression_mode" does not exist') &&
          !error.message.includes('column "progression_tiers" does not exist'))
      ) {
        throw error
      }
    }

    return {
      ...rpgRow,
      visibility: normalizeRpgVisibility(rpgRow.visibility),
      progressionMode,
      progressionTiers,
    }
  },

  async getCharacter(rpgId: string, characterId: string): Promise<CharacterDetailRowDto | null> {
    let rows: CharacterDetailRowDto[] = []

    try {
      rows = await prisma.$queryRaw<CharacterDetailRowDto[]>(Prisma.sql`
        SELECT
          c.id,
          c.name,
          c.image,
          c.race_key AS "raceKey",
          c.class_key AS "classKey",
          c.skill_points AS "skillPoints",
          COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          c.character_type AS "characterType",
          c.visibility,
          COALESCE(c.progression_mode, 'xp_level') AS "progressionMode",
          COALESCE(c.progression_label, 'Level 1') AS "progressionLabel",
          COALESCE(c.progression_required, 0) AS "progressionRequired",
          COALESCE(c.progression_current, 0) AS "progressionCurrent",
          c.created_by_user_id AS "createdByUserId",
          c.life,
          c.defense,
          c.mana,
          c.stamina AS exhaustion,
          c.sanity,
          c.statuses,
          COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
          c.attributes,
          c.skills,
          COALESCE(c.identity, '{}'::jsonb) AS identity,
          COALESCE(c.characteristics, '{}'::jsonb) AS characteristics,
          c.created_at AS "createdAt"
        FROM rpg_characters c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.id = ${characterId}
          AND c.rpg_id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "skill_points" does not exist') ||
          error.message.includes('column "cost_resource_name" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_label" does not exist') ||
          error.message.includes('column "progression_required" does not exist') ||
          error.message.includes('column "progression_current" does not exist'))
      ) {
        rows = await prisma.$queryRaw<CharacterDetailRowDto[]>(Prisma.sql`
          SELECT
            c.id,
            c.name,
            c.image,
            c.race_key AS "raceKey",
            c.class_key AS "classKey",
            0::integer AS "skillPoints",
            'Skill Points' AS "costResourceName",
            c.character_type AS "characterType",
            c.visibility,
            'xp_level'::text AS "progressionMode",
            'Level 1'::text AS "progressionLabel",
            0::integer AS "progressionRequired",
            0::integer AS "progressionCurrent",
            c.created_by_user_id AS "createdByUserId",
            c.life,
            c.defense,
            c.mana,
            c.stamina AS exhaustion,
            c.sanity,
            c.statuses,
            COALESCE(c.current_statuses, '{}'::jsonb) AS "currentStatuses",
            c.attributes,
            c.skills,
            COALESCE(c.identity, '{}'::jsonb) AS identity,
            COALESCE(c.characteristics, '{}'::jsonb) AS characteristics,
            c.created_at AS "createdAt"
          FROM rpg_characters c
          WHERE c.id = ${characterId}
            AND c.rpg_id = ${rpgId}
          LIMIT 1
        `)
      } else {
        throw error
      }
    }
    const row = rows[0]
    return row
      ? { ...row, visibility: normalizeRpgVisibility(row.visibility) }
      : null
  },

  listSkillLabels(rpgId: string): Promise<CharacterDetailLabelDto[]> {
    return prisma.$queryRaw<CharacterDetailLabelDto[]>(Prisma.sql`
      SELECT key, label
      FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
    `)
  },

  listStatusLabels(rpgId: string): Promise<CharacterDetailLabelDto[]> {
    return prisma.$queryRaw<CharacterDetailLabelDto[]>(Prisma.sql`
      SELECT key, label
      FROM rpg_status_templates
      WHERE rpg_id = ${rpgId}
    `)
  },

  listIdentityFields(rpgId: string): Promise<CharacterDetailTemplateFieldDto[]> {
    return prisma.$queryRaw<CharacterDetailTemplateFieldDto[]>(Prisma.sql`
      SELECT key, label, position
      FROM rpg_character_identity_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  listCharacteristicFields(rpgId: string): Promise<CharacterDetailTemplateFieldDto[]> {
    return prisma.$queryRaw<CharacterDetailTemplateFieldDto[]>(Prisma.sql`
      SELECT key, label, position
      FROM rpg_character_characteristic_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  listAttributeLabels(rpgId: string): Promise<CharacterDetailLabelDto[]> {
    return prisma.$queryRaw<CharacterDetailLabelDto[]>(Prisma.sql`
      SELECT key, label
      FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  },

  listRaceLabels(rpgId: string): Promise<CharacterDetailLabelDto[]> {
    return prisma.$queryRaw<CharacterDetailLabelDto[]>(Prisma.sql`
      SELECT key, label
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
    `)
  },

  listClassLabels(rpgId: string): Promise<CharacterDetailClassLabelDto[]> {
    return prisma.$queryRaw<CharacterDetailClassLabelDto[]>(Prisma.sql`
      SELECT id, key, label
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
    `)
  },
}
