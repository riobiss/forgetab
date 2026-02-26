import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import {
  getDefaultProgressionTiers,
  isProgressionMode,
  normalizeProgressionTiers,
  type ProgressionMode,
} from "@/lib/rpg/progression"
import type { RpgAccess } from "./types"

export async function getRpgAccess(rpgId: string, userId: string): Promise<RpgAccess> {
  let rows: Array<{
    ownerId: string
    useRaceBonuses: boolean
    useClassBonuses: boolean
    useInventoryWeightLimit: boolean
    allowMultiplePlayerCharacters: boolean
    progressionMode: string
    progressionTiers: Prisma.JsonValue
  }> = []

  try {
    rows = await prisma.$queryRaw<
      Array<{
        ownerId: string
        useRaceBonuses: boolean
        useClassBonuses: boolean
        useInventoryWeightLimit: boolean
        allowMultiplePlayerCharacters: boolean
        progressionMode: string
        progressionTiers: Prisma.JsonValue
      }>
    >(
      Prisma.sql`
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
      `,
    )
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
        rows = await prisma.$queryRaw<
          Array<{
            ownerId: string
            useRaceBonuses: boolean
            useClassBonuses: boolean
            useInventoryWeightLimit: boolean
            allowMultiplePlayerCharacters: boolean
            progressionMode: string
            progressionTiers: Prisma.JsonValue
          }>
        >(
          Prisma.sql`
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
          `,
        )
      } catch {
        rows = await prisma.$queryRaw<
          Array<{
            ownerId: string
            useRaceBonuses: boolean
            useClassBonuses: boolean
            useInventoryWeightLimit: boolean
            allowMultiplePlayerCharacters: boolean
            progressionMode: string
            progressionTiers: Prisma.JsonValue
          }>
        >(
          Prisma.sql`
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
          `,
        )
      }
    } else {
      throw error
    }
  }

  const rpg = rows[0]
  if (!rpg) {
    return {
      exists: false,
      canAccess: false,
      isOwner: false,
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: getDefaultProgressionTiers("xp_level"),
    }
  }

  const progressionMode = isProgressionMode(rpg.progressionMode)
    ? rpg.progressionMode
    : ("xp_level" as ProgressionMode)
  const progressionTiers = normalizeProgressionTiers(
    rpg.progressionTiers,
    progressionMode,
  )

  if (rpg.ownerId === userId) {
    return {
      exists: true,
      canAccess: true,
      isOwner: true,
      useRaceBonuses: rpg.useRaceBonuses,
      useClassBonuses: rpg.useClassBonuses,
      useInventoryWeightLimit: rpg.useInventoryWeightLimit,
      allowMultiplePlayerCharacters: rpg.allowMultiplePlayerCharacters,
      progressionMode,
      progressionTiers,
    }
  }

  const membership = await prisma.$queryRaw<Array<{ status: string; role: string }>>(Prisma.sql`
    SELECT status::text AS status, role::text AS role
    FROM rpg_members
    WHERE rpg_id = ${rpgId}
      AND user_id = ${userId}
    LIMIT 1
  `)

  const isAcceptedMember = membership[0]?.status === "accepted"
  const isModerator = isAcceptedMember && membership[0]?.role === "moderator"

  return {
    exists: true,
    canAccess: isAcceptedMember,
    isOwner: isModerator,
    useRaceBonuses: rpg.useRaceBonuses,
    useClassBonuses: rpg.useClassBonuses,
    useInventoryWeightLimit: rpg.useInventoryWeightLimit,
    allowMultiplePlayerCharacters: rpg.allowMultiplePlayerCharacters,
    progressionMode,
    progressionTiers,
  }
}
