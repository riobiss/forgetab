import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"

export const prismaRpgAccessRepository: RpgAccessRepository = {
  async getRpgAccessRow(rpgId) {
    let rows: Awaited<ReturnType<RpgAccessRepository["getRpgAccessRow"]>>[] = []

    try {
      rows = await prisma.$queryRaw<NonNullable<Awaited<ReturnType<RpgAccessRepository["getRpgAccessRow"]>>>[]>(Prisma.sql`
        SELECT
          owner_id AS "ownerId",
          COALESCE(use_race_bonuses, COALESCE(use_class_race_bonuses, false)) AS "useRaceBonuses",
          COALESCE(use_class_bonuses, COALESCE(use_class_race_bonuses, false)) AS "useClassBonuses",
          COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit",
          COALESCE(allow_multiple_player_characters, false) AS "allowMultiplePlayerCharacters",
          COALESCE(progression_mode, 'xp_level') AS "progressionMode",
          COALESCE(progression_tiers, '[{"label":"Level 1","required":0}]'::jsonb) AS "progressionTiers"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "use_race_bonuses" does not exist') ||
          error.message.includes('column "use_class_bonuses" does not exist') ||
          error.message.includes('column "use_class_race_bonuses" does not exist') ||
          error.message.includes('column "use_inventory_weight_limit" does not exist') ||
          error.message.includes('column "allow_multiple_player_characters" does not exist') ||
          error.message.includes('column "progression_mode" does not exist') ||
          error.message.includes('column "progression_tiers" does not exist'))
      ) {
        try {
          rows = await prisma.$queryRaw<NonNullable<Awaited<ReturnType<RpgAccessRepository["getRpgAccessRow"]>>>[]>(Prisma.sql`
            SELECT
              owner_id AS "ownerId",
              COALESCE(use_class_race_bonuses, false) AS "useRaceBonuses",
              COALESCE(use_class_race_bonuses, false) AS "useClassBonuses",
              false AS "useInventoryWeightLimit",
              false AS "allowMultiplePlayerCharacters",
              'xp_level'::text AS "progressionMode",
              '[{"label":"Level 1","required":0}]'::jsonb AS "progressionTiers"
            FROM rpgs
            WHERE id = ${rpgId}
            LIMIT 1
          `)
        } catch {
          rows = await prisma.$queryRaw<NonNullable<Awaited<ReturnType<RpgAccessRepository["getRpgAccessRow"]>>>[]>(Prisma.sql`
            SELECT
              owner_id AS "ownerId",
              false AS "useRaceBonuses",
              false AS "useClassBonuses",
              false AS "useInventoryWeightLimit",
              false AS "allowMultiplePlayerCharacters",
              'xp_level'::text AS "progressionMode",
              '[{"label":"Level 1","required":0}]'::jsonb AS "progressionTiers"
            FROM rpgs
            WHERE id = ${rpgId}
            LIMIT 1
          `)
        }
      } else {
        throw error
      }
    }

    return rows[0] ?? null
  },

  async getMembership(rpgId, userId) {
    const rows = await prisma.$queryRaw<NonNullable<Awaited<ReturnType<RpgAccessRepository["getMembership"]>>>[]>(Prisma.sql`
      SELECT status::text AS status, role::text AS role
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    return rows[0] ?? null
  },
}
