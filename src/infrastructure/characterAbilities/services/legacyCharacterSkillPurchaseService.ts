import { Prisma } from "../../../../generated/prisma/client.js"
import type { CharacterSkillPurchaseService } from "@/application/characterAbilities/ports/CharacterSkillPurchaseService"
import { prisma } from "@/lib/prisma"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"
import { AppError } from "@/shared/errors/AppError"

type CharacterLockedRow = {
  id: string
  rpgId: string
  ownerId: string
  createdByUserId: string | null
  raceKey: string | null
  classKey: string | null
  characterType: "player" | "npc" | "monster"
  skillPoints: number
  abilities: Prisma.JsonValue
  costsEnabled: boolean
}

type SkillLevelRow = {
  levelNumber: number
  cost: Prisma.JsonValue
}

function mapSchemaErrors(error: unknown, fallbackMessage: string): never {
  if (
    error instanceof Error &&
    (error.message.includes('column "skill_points" does not exist') ||
      error.message.includes('column "abilities" does not exist') ||
      error.message.includes('column "costs_enabled" does not exist'))
  ) {
    throw new AppError("Estrutura de custos desatualizada. Rode a migration mais recente.", 500)
  }

  throw new AppError(fallbackMessage, 500)
}

export const legacyCharacterSkillPurchaseService: CharacterSkillPurchaseService = {
  async buySkill(characterId, userId, params) {
    try {
      return await prisma.$transaction(async (tx) => {
        const characterRows = await tx.$queryRaw<CharacterLockedRow[]>(Prisma.sql`
          SELECT
            c.id,
            c.rpg_id AS "rpgId",
            r.owner_id AS "ownerId",
            c.created_by_user_id AS "createdByUserId",
            c.race_key AS "raceKey",
            c.class_key AS "classKey",
            c.character_type AS "characterType",
            c.skill_points AS "skillPoints",
            c.abilities,
            COALESCE(r.costs_enabled, false) AS "costsEnabled"
          FROM rpg_characters c
          INNER JOIN rpgs r ON r.id = c.rpg_id
          WHERE c.id = ${characterId}
          FOR UPDATE
        `)

        const character = characterRows[0]
        if (!character) throw new AppError("Personagem nao encontrado.", 404)
        if (character.characterType !== "player") {
          throw new AppError("Somente personagens do tipo player podem comprar habilidades.", 400)
        }
        if (!(character.createdByUserId === userId || character.ownerId === userId)) {
          throw new AppError("Sem permissao para comprar habilidades neste personagem.", 403)
        }
        if (!character.costsEnabled) {
          throw new AppError("Sistema de custos desativado neste RPG.", 400)
        }

        const skillAccessRows = await tx.$queryRaw<
          Array<{
            skillId: string
            hasClassLink: boolean
            classMatched: boolean
            hasRaceLink: boolean
            raceMatched: boolean
          }>
        >(Prisma.sql`
          SELECT
            s.id AS "skillId",
            EXISTS(
              SELECT 1
              FROM skill_class_links scl
              INNER JOIN rpg_class_templates ct ON ct.id = scl.class_template_id
              WHERE scl.skill_id = s.id
                AND ct.rpg_id = ${character.rpgId}
            ) AS "hasClassLink",
            EXISTS(
              SELECT 1
              FROM skill_class_links scl
              INNER JOIN rpg_class_templates ct ON ct.id = scl.class_template_id
              WHERE scl.skill_id = s.id
                AND ct.rpg_id = ${character.rpgId}
                AND (
                  ct.key = ${character.classKey}
                  OR ct.id = ${character.classKey}
                )
            ) AS "classMatched",
            EXISTS(
              SELECT 1
              FROM skill_race_links srl
              INNER JOIN rpg_race_templates rt ON rt.id = srl.race_template_id
              WHERE srl.skill_id = s.id
                AND rt.rpg_id = ${character.rpgId}
            ) AS "hasRaceLink",
            EXISTS(
              SELECT 1
              FROM skill_race_links srl
              INNER JOIN rpg_race_templates rt ON rt.id = srl.race_template_id
              WHERE srl.skill_id = s.id
                AND rt.rpg_id = ${character.rpgId}
                AND (
                  rt.key = ${character.raceKey}
                  OR rt.id = ${character.raceKey}
                )
            ) AS "raceMatched"
          FROM skills s
          WHERE s.id = ${params.skillId}
            AND s.rpg_id = ${character.rpgId}
          LIMIT 1
        `)

        const skillAccess = skillAccessRows[0]
        if (!skillAccess) {
          throw new AppError("Habilidade nao encontrada.", 404)
        }

        const hasRestrictions = skillAccess.hasClassLink || skillAccess.hasRaceLink
        const canBuyByRestriction = skillAccess.classMatched || skillAccess.raceMatched

        if (hasRestrictions && !canBuyByRestriction) {
          throw new AppError("Nao e permitido comprar esta habilidade para a classe ou raca do personagem.", 400)
        }

        const levelRows = await tx.$queryRaw<SkillLevelRow[]>(Prisma.sql`
          SELECT level_number AS "levelNumber", cost
          FROM skill_levels
          WHERE skill_id = ${params.skillId}
            AND level_number = ${params.level}
          LIMIT 1
        `)
        const skillLevel = levelRows[0]
        if (!skillLevel) throw new AppError("Level da habilidade nao encontrado.", 404)

        const costPoints = parseCostPoints(skillLevel.cost) ?? 0
        const ownedAbilities = parseCharacterAbilities(character.abilities)
        if (ownedAbilities.some((item) => item.skillId === params.skillId && item.level === params.level)) {
          throw new AppError("Personagem ja possui este level da habilidade.", 409)
        }
        if (params.level > 1) {
          const hasPreviousLevel = ownedAbilities.some(
            (item) => item.skillId === params.skillId && item.level === params.level - 1,
          )
          if (!hasPreviousLevel) {
            throw new AppError(
              `Para comprar o level ${params.level}, primeiro compre o level ${params.level - 1}.`,
              400,
            )
          }
        }
        if (character.skillPoints < costPoints) {
          throw new AppError("Pontos insuficientes para comprar esta habilidade.", 400)
        }

        const nextAbilities = [
          ...ownedAbilities.filter((item) => item.skillId !== params.skillId),
          { skillId: params.skillId, level: params.level },
        ]

        const updated = await tx.rpgCharacter.update({
          where: { id: character.id },
          data: {
            skillPoints: { decrement: costPoints },
            abilities: nextAbilities as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
          select: { skillPoints: true },
        })

        return { status: 200 as const, success: true as const, remainingPoints: updated.skillPoints ?? 0 }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      mapSchemaErrors(error, "Erro interno ao comprar habilidade.")
    }
  },

  async removeSkill(characterId, userId, params) {
    try {
      return await prisma.$transaction(async (tx) => {
        const characterRows = await tx.$queryRaw<CharacterLockedRow[]>(Prisma.sql`
          SELECT
            c.id,
            c.rpg_id AS "rpgId",
            r.owner_id AS "ownerId",
            c.created_by_user_id AS "createdByUserId",
            c.race_key AS "raceKey",
            c.class_key AS "classKey",
            c.character_type AS "characterType",
            c.skill_points AS "skillPoints",
            c.abilities,
            COALESCE(r.costs_enabled, false) AS "costsEnabled"
          FROM rpg_characters c
          INNER JOIN rpgs r ON r.id = c.rpg_id
          WHERE c.id = ${characterId}
          FOR UPDATE
        `)

        const character = characterRows[0]
        if (!character) throw new AppError("Personagem nao encontrado.", 404)
        if (character.characterType !== "player") {
          throw new AppError("Somente personagens do tipo player podem remover habilidades.", 400)
        }
        if (!(character.createdByUserId === userId || character.ownerId === userId)) {
          throw new AppError("Sem permissao para remover habilidades neste personagem.", 403)
        }

        const ownedAbilities = parseCharacterAbilities(character.abilities)
        const hasLevel = ownedAbilities.some(
          (item) => item.skillId === params.skillId && item.level === params.level,
        )
        if (!hasLevel) throw new AppError("Habilidade nao encontrada no personagem.", 404)

        const levelRows = await tx.$queryRaw<SkillLevelRow[]>(Prisma.sql`
          SELECT level_number AS "levelNumber", cost
          FROM skill_levels
          WHERE skill_id = ${params.skillId}
            AND level_number = ${params.level}
          LIMIT 1
        `)
        const skillLevel = levelRows[0]
        if (!skillLevel) throw new AppError("Level da habilidade nao encontrado.", 404)

        const refundPoints = character.costsEnabled ? parseCostPoints(skillLevel.cost) ?? 0 : 0
        const nextAbilities = ownedAbilities.filter(
          (item) => !(item.skillId === params.skillId && item.level === params.level),
        )

        const updated = await tx.rpgCharacter.update({
          where: { id: character.id },
          data: {
            skillPoints: refundPoints > 0 ? { increment: refundPoints } : undefined,
            abilities: nextAbilities as Prisma.InputJsonValue,
            updatedAt: new Date(),
          },
          select: { skillPoints: true },
        })

        return { status: 200 as const, success: true as const, remainingPoints: updated.skillPoints ?? 0 }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      mapSchemaErrors(error, "Erro interno ao remover habilidade.")
    }
  },
}
