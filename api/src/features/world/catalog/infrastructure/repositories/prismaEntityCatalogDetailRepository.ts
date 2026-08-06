import { Prisma } from "../../../../../../generated/prisma/client.js"
import type {
  EntityCatalogDetailRepository,
  EntityCatalogDetailSnapshot
} from "@/features/world/catalog/application/ports/EntityCatalogDetailRepository.js"
import { prisma } from "@/lib/prisma"
import {
  mapClassDetailRow,
  mapRaceDetailRow,
  toTemplateOptions
} from "@/features/world/catalog/infrastructure/repositories/entityCatalogDetailMappers"
import type {
  DbClassRow,
  DbRaceRow
} from "@/features/world/catalog/infrastructure/repositories/entityCatalogDetailRows"

async function queryAttributeTemplates(rpgId: string) {
  return prisma.$queryRaw<Array<{ key: string; label: string }>>(Prisma.sql`
    SELECT key, label
    FROM rpg_attribute_templates
    WHERE rpg_id = ${rpgId}
    ORDER BY position ASC
  `)
}

async function querySkillTemplates(rpgId: string) {
  return prisma.$queryRaw<Array<{ key: string; label: string }>>(Prisma.sql`
    SELECT key, label
    FROM rpg_skill_templates
    WHERE rpg_id = ${rpgId}
    ORDER BY position ASC
  `)
}

export const prismaEntityCatalogDetailRepository: EntityCatalogDetailRepository =
  {
    async getClassDetail({
      rpgId,
      classId
    }): Promise<EntityCatalogDetailSnapshot | null> {
      const rows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.key,
          c.label,
          r.owner_id AS "ownerId",
          r.visibility,
          COALESCE(r.costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          c.category,
          c.attribute_bonuses AS "attributeBonuses",
          c.skill_bonuses AS "skillBonuses",
          c.catalog_meta AS "catalogMeta"
        FROM rpg_class_templates c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.id = ${classId}
          AND c.rpg_id = ${rpgId}
        LIMIT 1
      `)

      return rows[0] ? mapClassDetailRow(rows[0]) : null
    },

    async getRaceDetail({
      rpgId,
      raceKey
    }): Promise<EntityCatalogDetailSnapshot | null> {
      const rows = await prisma.$queryRaw<DbRaceRow[]>(Prisma.sql`
        SELECT
          t.key,
          t.id,
          t.label,
          r.owner_id AS "ownerId",
          r.visibility,
          COALESCE(r.costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          t.category,
          t.attribute_bonuses AS "attributeBonuses",
          t.skill_bonuses AS "skillBonuses",
          t.lore,
          t.catalog_meta AS "catalogMeta"
        FROM rpg_race_templates t
        INNER JOIN rpgs r ON r.id = t.rpg_id
        WHERE t.rpg_id = ${rpgId}
          AND t.key = ${raceKey}
        LIMIT 1
      `)

      return rows[0] ? mapRaceDetailRow(rows[0]) : null
    },

    async listAttributeTemplates(rpgId) {
      return toTemplateOptions(await queryAttributeTemplates(rpgId))
    },

    async listSkillTemplates(rpgId) {
      return toTemplateOptions(await querySkillTemplates(rpgId))
    }
  }
