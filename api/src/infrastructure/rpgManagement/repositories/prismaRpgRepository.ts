import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { ProgressionMode } from "@/lib/rpg/progression"
import type { RpgRepository } from "@/application/rpgManagement/ports/RpgRepository"
import { normalizeRpgVisibility } from "@/infrastructure/shared/normalizeRpgVisibility"
import type {
  RpgAdvancedSettingsInput,
  RpgCoreUpdateInput,
  RpgCreateBaseInput,
  RpgCreateSettingsInput,
  RpgRow,
} from "@/application/rpgManagement/types"

function isMissingColumn(error: unknown, column: string) {
  return error instanceof Error && error.message.includes(`column "${column}" does not exist`)
}

export const prismaRpgRepository: RpgRepository = {
  async createBase(data: RpgCreateBaseInput) {
    const row = await prisma.rpg.create({ data })
    return {
      ...row,
      visibility: normalizeRpgVisibility(row.visibility),
    }
  },

  async applyCreateSettings(rpgId, data: RpgCreateSettingsInput) {
    const enabledAbilityCategoriesSql =
      data.enabledAbilityCategories.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(data.enabledAbilityCategories)}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`

    try {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE rpgs
        SET
          costs_enabled = ${data.costsEnabled},
          cost_resource_name = ${data.costResourceName},
          use_mundi_map = ${data.useMundiMap},
          use_race_bonuses = ${data.useRaceBonuses},
          use_class_bonuses = ${data.useClassBonuses},
          use_class_race_bonuses = ${data.useRaceBonuses || data.useClassBonuses},
          use_inventory_weight_limit = ${data.useInventoryWeightLimit},
          allow_multiple_player_characters = ${data.allowMultiplePlayerCharacters},
          users_can_manage_own_xp = ${data.usersCanManageOwnXp},
          allow_skill_point_distribution = ${data.allowSkillPointDistribution},
          ability_categories_enabled = ${data.abilityCategoriesEnabled},
          enabled_ability_categories = ${enabledAbilityCategoriesSql},
          progression_mode = ${data.progressionMode},
          progression_tiers = ${JSON.stringify(data.progressionTiers)}::jsonb
        WHERE id = ${rpgId}
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "use_race_bonuses" does not exist') ||
          error.message.includes('column "use_class_bonuses" does not exist') ||
          error.message.includes('column "allow_multiple_player_characters" does not exist') ||
          error.message.includes('column "users_can_manage_own_xp" does not exist') ||
          error.message.includes('column "allow_skill_point_distribution" does not exist') ||
          error.message.includes('column "ability_categories_enabled" does not exist') ||
          error.message.includes('column "enabled_ability_categories" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_tiers" does not exist'))
      ) {
        try {
          await prisma.$executeRaw(Prisma.sql`
            UPDATE rpgs
            SET
              costs_enabled = ${data.costsEnabled},
              cost_resource_name = ${data.costResourceName},
              use_mundi_map = ${data.useMundiMap},
              use_class_race_bonuses = ${data.useRaceBonuses || data.useClassBonuses},
              use_inventory_weight_limit = ${data.useInventoryWeightLimit},
              allow_multiple_player_characters = ${data.allowMultiplePlayerCharacters},
              users_can_manage_own_xp = ${data.usersCanManageOwnXp},
              allow_skill_point_distribution = ${data.allowSkillPointDistribution},
              ability_categories_enabled = ${data.abilityCategoriesEnabled},
              enabled_ability_categories = ${enabledAbilityCategoriesSql}
            WHERE id = ${rpgId}
          `)
        } catch {
          // Mantem compatibilidade quando a migration ainda nao foi aplicada.
        }
      } else {
        throw error
      }
    }
  },

  async findById(rpgId) {
    let rows: RpgRow[] = []

    try {
      rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          title,
          description,
          image,
          visibility,
          COALESCE(costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          COALESCE(use_mundi_map, false) AS "useMundiMap",
          COALESCE(use_race_bonuses, COALESCE(use_class_race_bonuses, false)) AS "useRaceBonuses",
          COALESCE(use_class_bonuses, COALESCE(use_class_race_bonuses, false)) AS "useClassBonuses",
          COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses",
          COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit",
          COALESCE(allow_multiple_player_characters, false) AS "allowMultiplePlayerCharacters",
          COALESCE(users_can_manage_own_xp, true) AS "usersCanManageOwnXp",
          COALESCE(allow_skill_point_distribution, true) AS "allowSkillPointDistribution",
          COALESCE(ability_categories_enabled, false) AS "abilityCategoriesEnabled",
          COALESCE(enabled_ability_categories, ARRAY[]::text[]) AS "enabledAbilityCategories",
          COALESCE(progression_mode, 'xp_level') AS "progressionMode",
          COALESCE(progression_tiers, '[{\"label\":\"Level 1\",\"required\":0}]'::jsonb) AS "progressionTiers"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "costs_enabled" does not exist') ||
          error.message.includes('column "cost_resource_name" does not exist') ||
          error.message.includes('column "image" does not exist') ||
          error.message.includes('column "use_race_bonuses" does not exist') ||
          error.message.includes('column "use_class_bonuses" does not exist') ||
          error.message.includes('column "use_class_race_bonuses" does not exist') ||
          error.message.includes('column "use_inventory_weight_limit" does not exist') ||
          error.message.includes('column "allow_multiple_player_characters" does not exist') ||
          error.message.includes('column "users_can_manage_own_xp" does not exist') ||
          error.message.includes('column "allow_skill_point_distribution" does not exist') ||
          error.message.includes('column "ability_categories_enabled" does not exist') ||
          error.message.includes('column "enabled_ability_categories" does not exist') ||
          error.message.includes('column "use_mundi_map" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_tiers" does not exist'))
      ) {
        try {
          rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
            SELECT
              id,
              owner_id AS "ownerId",
              title,
              description,
              null::text AS image,
              visibility,
              false AS "costsEnabled",
              'Skill Points' AS "costResourceName",
              false AS "useMundiMap",
              COALESCE(use_class_race_bonuses, false) AS "useRaceBonuses",
              COALESCE(use_class_race_bonuses, false) AS "useClassBonuses",
              COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses",
              false AS "useInventoryWeightLimit",
              false AS "allowMultiplePlayerCharacters",
              true AS "usersCanManageOwnXp",
              true AS "allowSkillPointDistribution",
              false AS "abilityCategoriesEnabled",
              ARRAY[]::text[] AS "enabledAbilityCategories",
              'xp_level'::text AS "progressionMode",
              '[{\"label\":\"Level 1\",\"required\":0}]'::jsonb AS "progressionTiers"
            FROM rpgs
            WHERE id = ${rpgId}
            LIMIT 1
          `)
        } catch {
          rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
            SELECT
              id,
              owner_id AS "ownerId",
              title,
              description,
              null::text AS image,
              visibility,
              false AS "costsEnabled",
              'Skill Points' AS "costResourceName",
              false AS "useMundiMap",
              false AS "useRaceBonuses",
              false AS "useClassBonuses",
              false AS "useClassRaceBonuses",
              false AS "useInventoryWeightLimit",
              false AS "allowMultiplePlayerCharacters",
              true AS "usersCanManageOwnXp",
              true AS "allowSkillPointDistribution",
              false AS "abilityCategoriesEnabled",
              ARRAY[]::text[] AS "enabledAbilityCategories",
              'xp_level'::text AS "progressionMode",
              '[{\"label\":\"Level 1\",\"required\":0}]'::jsonb AS "progressionTiers"
            FROM rpgs
            WHERE id = ${rpgId}
            LIMIT 1
          `)
        }
      } else {
        throw error
      }
    }
    const row = rows[0]
    return row
      ? { ...row, visibility: normalizeRpgVisibility(row.visibility) }
      : null
  },

  async getCurrentProgressionMode(rpgId) {
    try {
      const rows = await prisma.$queryRaw<Array<{ progressionMode: string }>>(Prisma.sql`
        SELECT COALESCE(progression_mode, 'xp_level') AS "progressionMode"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
      return (rows[0]?.progressionMode as ProgressionMode | undefined) ?? "xp_level"
    } catch (error) {
      if (isMissingColumn(error, "progression_mode")) {
        return "xp_level"
      }
      throw error
    }
  },

  async getImageById(rpgId) {
    const rows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
      SELECT image
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)

    return rows[0]?.image ?? null
  },

  async getOwnedImage(rpgId, ownerId) {
    const rows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
      SELECT image
      FROM rpgs
      WHERE id = ${rpgId}
        AND owner_id = ${ownerId}
      LIMIT 1
    `)

    return rows[0]?.image ?? null
  },

  async updateCore(rpgId, data: RpgCoreUpdateInput) {
    const updated = await prisma.rpg.updateMany({
      where: { id: rpgId },
      data,
    })

    return updated.count > 0
  },

  async updateAdvanced(rpgId, data: RpgAdvancedSettingsInput) {
    try {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE rpgs
        SET
          use_mundi_map = ${data.useMundiMap},
          use_race_bonuses = ${data.useRaceBonuses},
          use_class_bonuses = ${data.useClassBonuses},
          use_class_race_bonuses = ${data.useRaceBonuses || data.useClassBonuses},
          use_inventory_weight_limit = ${data.useInventoryWeightLimit},
          allow_multiple_player_characters = ${data.allowMultiplePlayerCharacters},
          users_can_manage_own_xp = ${data.usersCanManageOwnXp},
          allow_skill_point_distribution = ${data.allowSkillPointDistribution},
          ability_categories_enabled = ${data.abilityCategoriesEnabled},
          enabled_ability_categories = ${Prisma.sql`ARRAY[${Prisma.join(data.enabledAbilityCategories)}]::text[]`},
          progression_mode = ${data.progressionMode},
          progression_tiers = ${JSON.stringify(data.progressionTiers)}::jsonb
        WHERE id = ${rpgId}
      `)
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('column "use_race_bonuses" does not exist') ||
          error.message.includes('column "use_class_bonuses" does not exist') ||
          error.message.includes('column "allow_multiple_player_characters" does not exist') ||
          error.message.includes('column "users_can_manage_own_xp" does not exist') ||
          error.message.includes('column "allow_skill_point_distribution" does not exist') ||
          error.message.includes('column "ability_categories_enabled" does not exist') ||
          error.message.includes('column "enabled_ability_categories" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_tiers" does not exist')
        ) {
          try {
            await prisma.$executeRaw(Prisma.sql`
              UPDATE rpgs
              SET
                use_mundi_map = ${data.useMundiMap},
                use_class_race_bonuses = ${data.useRaceBonuses || data.useClassBonuses},
                use_inventory_weight_limit = ${data.useInventoryWeightLimit},
                allow_multiple_player_characters = ${data.allowMultiplePlayerCharacters},
                users_can_manage_own_xp = ${data.usersCanManageOwnXp},
                allow_skill_point_distribution = ${data.allowSkillPointDistribution},
                ability_categories_enabled = ${data.abilityCategoriesEnabled},
                enabled_ability_categories = ${Prisma.sql`ARRAY[${Prisma.join(data.enabledAbilityCategories)}]::text[]`}
              WHERE id = ${rpgId}
            `)
          } catch (innerError) {
            if (
              !(innerError instanceof Error) ||
              (!innerError.message.includes('column "use_class_race_bonuses" does not exist') &&
                !innerError.message.includes('column "use_inventory_weight_limit" does not exist') &&
                !innerError.message.includes('column "allow_multiple_player_characters" does not exist') &&
                !innerError.message.includes('column "users_can_manage_own_xp" does not exist') &&
                !innerError.message.includes('column "allow_skill_point_distribution" does not exist') &&
                !innerError.message.includes('column "ability_categories_enabled" does not exist') &&
                !innerError.message.includes('column "enabled_ability_categories" does not exist') &&
                !innerError.message.includes('column "use_mundi_map" does not exist') &&
                !innerError.message.includes('column "progression_mode" does not exist') &&
                !innerError.message.includes('column "progression_tiers" does not exist'))
            ) {
              throw innerError
            }
          }
        } else if (
          !error.message.includes('column "use_class_race_bonuses" does not exist') &&
          !error.message.includes('column "use_inventory_weight_limit" does not exist') &&
          !error.message.includes('column "allow_multiple_player_characters" does not exist') &&
          !error.message.includes('column "users_can_manage_own_xp" does not exist') &&
          !error.message.includes('column "allow_skill_point_distribution" does not exist') &&
          !error.message.includes('column "ability_categories_enabled" does not exist') &&
          !error.message.includes('column "enabled_ability_categories" does not exist') &&
          !error.message.includes('column "use_mundi_map" does not exist') &&
          !error.message.includes('column "progression_mode" does not exist') &&
          !error.message.includes('column "progression_tiers" does not exist')
        ) {
          throw error
        }
      } else {
        throw error
      }
    }
  },

  async updateImage(rpgId, image) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpgs
      SET image = ${image}
      WHERE id = ${rpgId}
      RETURNING id
    `)

    return rows.length > 0
  },

  async deleteOwned(rpgId, ownerId) {
    const deleted = await prisma.rpg.deleteMany({ where: { id: rpgId, ownerId } })
    return deleted.count > 0
  },
}
