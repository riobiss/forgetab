import { Prisma } from "../../../../../../generated/prisma/client.js"
import type {
  EntityCatalogCharacterProgression,
  EntityCatalogCharacterProgressionRepository
} from "@/features/world/catalog/application/ports/EntityCatalogCharacterProgressionRepository"
import { prisma } from "@/features/shared/infrastructure/database/prisma"

async function listClassProgressions(params: {
  rpgId: string
  userId: string
  classKey: string
  classId: string
}) {
  return prisma.$queryRaw<EntityCatalogCharacterProgression[]>(Prisma.sql`
    SELECT
      COALESCE(c.progression_mode, 'xp_level') AS "progressionMode",
      COALESCE(r.progression_tiers, '[{"label":"Level 1","required":0}]'::jsonb) AS "progressionTiers",
      COALESCE(c.progression_current, 0) AS "progressionCurrent"
    FROM rpg_characters c
    INNER JOIN rpgs r ON r.id = c.rpg_id
    WHERE c.rpg_id = ${params.rpgId}
      AND c.created_by_user_id = ${params.userId}
      AND c.character_type = 'player'::"RpgCharacterType"
      AND (c.class_key = ${params.classKey} OR c.class_key = ${params.classId})
  `)
}

async function listRaceProgressions(params: {
  rpgId: string
  userId: string
  raceKey: string
}) {
  return prisma.$queryRaw<EntityCatalogCharacterProgression[]>(Prisma.sql`
    SELECT
      COALESCE(c.progression_mode, 'xp_level') AS "progressionMode",
      COALESCE(r.progression_tiers, '[{"label":"Level 1","required":0}]'::jsonb) AS "progressionTiers",
      COALESCE(c.progression_current, 0) AS "progressionCurrent"
    FROM rpg_characters c
    INNER JOIN rpgs r ON r.id = c.rpg_id
    WHERE c.rpg_id = ${params.rpgId}
      AND c.created_by_user_id = ${params.userId}
      AND c.character_type = 'player'::"RpgCharacterType"
      AND c.race_key = ${params.raceKey}
  `)
}

export const prismaEntityCatalogCharacterProgressionRepository: EntityCatalogCharacterProgressionRepository =
  {
    listOwnedClassProgressions: listClassProgressions,
    listOwnedRaceProgressions: listRaceProgressions
  }
