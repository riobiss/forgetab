import { Prisma } from "../../../../../../generated/prisma/client.js"
import type { EntityCatalogPurchaseRepository } from "@/features/world/catalog/application/ports/EntityCatalogPurchaseRepository"
import { prisma } from "@/features/shared/infrastructure/database/prisma"
import {
  emptyPurchaseState,
  toOwnedBySkill
} from "@/features/world/catalog/infrastructure/repositories/entityCatalogDetailMappers"

export const prismaEntityCatalogPurchaseRepository: EntityCatalogPurchaseRepository =
  {
    async getClassPurchaseState(params) {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string
          skillPoints: number
          abilities: Prisma.JsonValue
        }>
      >(Prisma.sql`
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
      if (!player) return emptyPurchaseState(params)

      return {
        characterId: player.id,
        costsEnabled: params.costsEnabled,
        costResourceName: params.costResourceName,
        initialPoints: player.skillPoints,
        initialOwnedBySkill: toOwnedBySkill(player.abilities)
      }
    },

    async getRacePurchaseState(params) {
      const rows = await prisma.$queryRaw<
        Array<{
          id: string
          skillPoints: number
          abilities: Prisma.JsonValue
          costsEnabled: boolean
          costResourceName: string
        }>
      >(Prisma.sql`
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
        return emptyPurchaseState({
          costsEnabled: false,
          costResourceName: "Skill Points"
        })
      }

      return {
        characterId: player.id,
        costsEnabled: player.costsEnabled,
        costResourceName: player.costResourceName,
        initialPoints: player.skillPoints,
        initialOwnedBySkill: toOwnedBySkill(player.abilities)
      }
    }
  }
