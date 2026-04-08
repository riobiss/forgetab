import { Prisma } from "../../../../generated/prisma/client.js"
import type { EntityCatalogDetailRepository, EntityCatalogDetailSnapshot } from "@/application/entityCatalog/ports/EntityCatalogDetailRepository"
import type { EntityCatalogAbilityPurchaseState } from "@/application/entityCatalog/types"
import { prisma } from "@/lib/prisma"
import {
  emptyPurchaseState,
  hasMissingColumn,
  mapClassDetailRow,
  mapRaceDetailRow,
  toOwnedBySkill,
  toTemplateOptions,
} from "@/infrastructure/entityCatalog/repositories/entityCatalogDetailMappers"
import type {
  DbClassRow,
  DbRaceRow,
} from "@/infrastructure/entityCatalog/repositories/entityCatalogDetailRows"
import { listClassCatalogAbilities, listRaceCatalogAbilities } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogAbilitiesRepository"
import { listClassCatalogPlayers, listRaceCatalogPlayers } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogPlayersRepository"

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

export const prismaEntityCatalogDetailRepository: EntityCatalogDetailRepository = {
  async getClassDetail({ rpgId, classId }): Promise<EntityCatalogDetailSnapshot | null> {
    let rows: DbClassRow[] = []
    try {
      rows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
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
    } catch (error) {
      if (
        !(
          hasMissingColumn(error, "catalog_meta") ||
          hasMissingColumn(error, "costs_enabled") ||
          hasMissingColumn(error, "cost_resource_name")
        )
      ) {
        throw error
      }

      rows = await prisma.$queryRaw<DbClassRow[]>(Prisma.sql`
        SELECT
          c.id,
          c.key,
          c.label,
          r.owner_id AS "ownerId",
          r.visibility,
          false AS "costsEnabled",
          'Skill Points' AS "costResourceName",
          c.category,
          c.attribute_bonuses AS "attributeBonuses",
          c.skill_bonuses AS "skillBonuses",
          NULL::jsonb AS "catalogMeta"
        FROM rpg_class_templates c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.id = ${classId}
          AND c.rpg_id = ${rpgId}
        LIMIT 1
      `)
    }

    const row = rows[0]
    if (!row) return null
    return mapClassDetailRow(row)
  },

  async getRaceDetail({ rpgId, raceKey }): Promise<EntityCatalogDetailSnapshot | null> {
    let rows: DbRaceRow[] = []
    try {
      rows = await prisma.$queryRaw<DbRaceRow[]>(Prisma.sql`
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
    } catch (error) {
      if (
        !(
          hasMissingColumn(error, "lore") ||
          hasMissingColumn(error, "catalog_meta") ||
          hasMissingColumn(error, "category") ||
          hasMissingColumn(error, "costs_enabled") ||
          hasMissingColumn(error, "cost_resource_name")
        )
      ) {
        throw error
      }

      rows = await prisma.$queryRaw<DbRaceRow[]>(Prisma.sql`
        SELECT
          t.key,
          t.id,
          t.label,
          r.owner_id AS "ownerId",
          r.visibility,
          false AS "costsEnabled",
          'Skill Points' AS "costResourceName",
          'geral'::text AS category,
          t.attribute_bonuses AS "attributeBonuses",
          t.skill_bonuses AS "skillBonuses",
          NULL::jsonb AS lore,
          NULL::jsonb AS "catalogMeta"
        FROM rpg_race_templates t
        INNER JOIN rpgs r ON r.id = t.rpg_id
        WHERE t.rpg_id = ${rpgId}
          AND t.key = ${raceKey}
        LIMIT 1
      `)
    }

    const row = rows[0]
    if (!row) return null
    return mapRaceDetailRow(row)
  },

  async listAttributeTemplates(rpgId) {
    return toTemplateOptions(await queryAttributeTemplates(rpgId))
  },

  async listSkillTemplates(rpgId) {
    return toTemplateOptions(await querySkillTemplates(rpgId))
  },

  listClassAbilities(classTemplateId) {
    return listClassCatalogAbilities(classTemplateId)
  },

  listRaceAbilities(raceTemplateId) {
    return listRaceCatalogAbilities(raceTemplateId)
  },

  listClassPlayers(params) {
    return listClassCatalogPlayers(params)
  },

  listRacePlayers(params) {
    return listRaceCatalogPlayers(params)
  },

  async getClassPurchaseState(params): Promise<EntityCatalogAbilityPurchaseState> {
    try {
      const rows = await prisma.$queryRaw<Array<{
        id: string
        skillPoints: number
        abilities: Prisma.JsonValue
      }>>(Prisma.sql`
        SELECT
          id,
          COALESCE(skill_points, 0) AS "skillPoints",
          COALESCE(abilities, '[]'::jsonb) AS abilities
        FROM rpg_characters
        WHERE rpg_id = ${params.rpgId}
          AND created_by_user_id = ${params.userId}
          AND character_type = 'player'::"RpgCharacterType"
          AND class_key = ${params.classKey}
        LIMIT 1
      `)

      const player = rows[0]
      if (!player) {
        return emptyPurchaseState(params)
      }

      return {
        characterId: player.id,
        costsEnabled: params.costsEnabled,
        costResourceName: params.costResourceName,
        initialPoints: player.skillPoints,
        initialOwnedBySkill: toOwnedBySkill(player.abilities),
      }
    } catch {
      return emptyPurchaseState(params)
    }
  },

  async getRacePurchaseState(params): Promise<EntityCatalogAbilityPurchaseState> {
    try {
      const rows = await prisma.$queryRaw<Array<{
        id: string
        skillPoints: number
        abilities: Prisma.JsonValue
        costsEnabled: boolean
        costResourceName: string
      }>>(Prisma.sql`
        SELECT
          c.id,
          COALESCE(c.skill_points, 0) AS "skillPoints",
          COALESCE(c.abilities, '[]'::jsonb) AS abilities,
          COALESCE(r.costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(r.cost_resource_name), ''), 'Skill Points') AS "costResourceName"
        FROM rpg_characters c
        INNER JOIN rpgs r ON r.id = c.rpg_id
        WHERE c.rpg_id = ${params.rpgId}
          AND c.created_by_user_id = ${params.userId}
          AND c.character_type = 'player'::"RpgCharacterType"
          AND c.race_key = ${params.raceKey}
        LIMIT 1
      `)

      const player = rows[0]
      if (!player) {
        return {
          characterId: null,
          costsEnabled: false,
          costResourceName: "Skill Points",
          initialPoints: 0,
          initialOwnedBySkill: {},
        }
      }

      return {
        characterId: player.id,
        costsEnabled: player.costsEnabled,
        costResourceName: player.costResourceName,
        initialPoints: player.skillPoints,
        initialOwnedBySkill: toOwnedBySkill(player.abilities),
      }
    } catch {
      return {
        characterId: null,
        costsEnabled: false,
        costResourceName: "Skill Points",
        initialPoints: 0,
        initialOwnedBySkill: {},
      }
    }
  },
}
