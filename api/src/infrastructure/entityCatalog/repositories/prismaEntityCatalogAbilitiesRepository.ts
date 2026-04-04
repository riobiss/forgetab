import { Prisma } from "../../../../generated/prisma/client.js"
import { mapEntityCatalogAbilities, type EntityCatalogAbilityRow } from "@/application/entityCatalog/use-cases/entityCatalogAbilities"
import { prisma } from "@/lib/prisma"

async function queryClassAbilityRows(templateId: string) {
  try {
    return await prisma.$queryRaw<EntityCatalogAbilityRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "skillName",
        NULL::text AS "skillDescription",
        NULL::text AS "skillCategory",
        NULL::text AS "skillType",
        NULL::text AS "skillActionType",
        COALESCE(s.tags, ARRAY[]::text[]) AS "skillTags",
        sl.level_number AS "levelNumber",
        sl.level_required AS "levelRequired",
        sl.summary,
        sl.stats,
        sl.cost,
        sl.requirement
      FROM skills s
      INNER JOIN skill_levels sl ON sl.skill_id = s.id
      INNER JOIN skill_class_links links ON links.skill_id = s.id
      WHERE links.class_template_id = ${templateId}
      ORDER BY s.updated_at DESC, s.created_at DESC, sl.level_number ASC
    `)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
      throw error
    }

    return prisma.$queryRaw<EntityCatalogAbilityRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "skillName",
        NULL::text AS "skillDescription",
        NULL::text AS "skillCategory",
        NULL::text AS "skillType",
        NULL::text AS "skillActionType",
        ARRAY[]::text[] AS "skillTags",
        sl.level_number AS "levelNumber",
        sl.level_required AS "levelRequired",
        sl.summary,
        sl.stats,
        sl.cost,
        sl.requirement
      FROM skills s
      INNER JOIN skill_levels sl ON sl.skill_id = s.id
      INNER JOIN skill_class_links links ON links.skill_id = s.id
      WHERE links.class_template_id = ${templateId}
      ORDER BY s.updated_at DESC, s.created_at DESC, sl.level_number ASC
    `)
  }
}

export async function listClassCatalogAbilities(templateId: string) {
  const rows = await queryClassAbilityRows(templateId)
  return mapEntityCatalogAbilities(rows)
}

async function queryRaceAbilityRows(templateId: string) {
  try {
    return await prisma.$queryRaw<EntityCatalogAbilityRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "skillName",
        NULL::text AS "skillDescription",
        NULL::text AS "skillCategory",
        NULL::text AS "skillType",
        NULL::text AS "skillActionType",
        COALESCE(s.tags, ARRAY[]::text[]) AS "skillTags",
        sl.level_number AS "levelNumber",
        sl.level_required AS "levelRequired",
        sl.summary,
        sl.stats,
        sl.cost,
        sl.requirement
      FROM skills s
      INNER JOIN skill_levels sl ON sl.skill_id = s.id
      INNER JOIN skill_race_links links ON links.skill_id = s.id
      WHERE links.race_template_id = ${templateId}
      ORDER BY s.updated_at DESC, s.created_at DESC, sl.level_number ASC
    `)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
      throw error
    }

    return prisma.$queryRaw<EntityCatalogAbilityRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "skillName",
        NULL::text AS "skillDescription",
        NULL::text AS "skillCategory",
        NULL::text AS "skillType",
        NULL::text AS "skillActionType",
        ARRAY[]::text[] AS "skillTags",
        sl.level_number AS "levelNumber",
        sl.level_required AS "levelRequired",
        sl.summary,
        sl.stats,
        sl.cost,
        sl.requirement
      FROM skills s
      INNER JOIN skill_levels sl ON sl.skill_id = s.id
      INNER JOIN skill_race_links links ON links.skill_id = s.id
      WHERE links.race_template_id = ${templateId}
      ORDER BY s.updated_at DESC, s.created_at DESC, sl.level_number ASC
    `)
  }
}

export async function listRaceCatalogAbilities(templateId: string) {
  const rows = await queryRaceAbilityRows(templateId)
  return mapEntityCatalogAbilities(rows)
}
