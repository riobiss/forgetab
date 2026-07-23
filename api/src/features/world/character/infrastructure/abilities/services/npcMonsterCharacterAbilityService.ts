import { Prisma } from "../../../../../../../generated/prisma/client.js"
import type { PurchasedAbilityViewDto } from "@/features/world/character/application/abilities/types.js"
import type { NpcMonsterCharacterAbilityService } from "@/features/world/character/application/abilities/ports/NpcMonsterCharacterAbilityService.js"
import { loadCharacterAbilitiesUseCase } from "@/features/world/character/application/abilities/use-cases/characterAbilities.js"
import { prismaRpgAccessRepository } from "@/features/world/character/infrastructure/repositories/prismaRpgAccessRepository.js"
import { prismaCharacterAbilitiesRepository } from "@/features/world/character/infrastructure/abilities/repositories/prismaCharacterAbilitiesRepository.js"
import { characterAbilitiesParserService } from "@/features/world/character/infrastructure/abilities/services/characterAbilitiesParserService.js"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver.js"
import { prisma } from "@/lib/prisma"
import { parseCharacterAbilities } from "@/features/world/character/infrastructure/abilities/services/characterAbilityCostParser.js"
import { AppError } from "@/features/shared/infrastructure/errors/AppError.js"

type CharacterLockedRow = {
  id: string
  rpgId: string
  ownerId: string
  characterType: "player" | "npc" | "monster"
  abilities: Prisma.JsonValue
}

async function assertCanManageNpcMonsterAbility(rpgId: string, userId: string) {
  const permission = await getRpgPermissionByPrisma(rpgId, userId)
  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
  if (!permission.canManage) {
    throw new AppError(
      "Sem permissao para gerenciar habilidades deste personagem.",
      403,
    )
  }
}

async function loadOwnedAbility(
  rpgId: string,
  characterId: string,
  userId: string,
  skillId: string,
  level: number,
): Promise<PurchasedAbilityViewDto> {
  const payload = await loadCharacterAbilitiesUseCase(
    {
      repository: prismaCharacterAbilitiesRepository,
      rpgAccessRepository: prismaRpgAccessRepository,
      parserService: characterAbilitiesParserService,
    },
    {
      rpgId,
      characterId,
      userId,
    },
  )

  const ability = payload?.abilities.find(
    (item) => item.skillId === skillId && item.levelNumber === level,
  )

  if (!ability) {
    throw new AppError("Habilidade nao encontrada no personagem.", 404)
  }

  return ability
}

function mapSchemaErrors(error: unknown, fallbackMessage: string): never {
  if (
    error instanceof Error &&
    (error.message.includes('column "abilities" does not exist') ||
      error.message.includes('relation "skills" does not exist') ||
      error.message.includes('relation "skill_levels" does not exist'))
  ) {
    throw new AppError(
      "Estrutura de habilidades desatualizada. Rode a migration mais recente.",
      500,
    )
  }

  throw new AppError(fallbackMessage, 500)
}

export const npcMonsterCharacterAbilityService: NpcMonsterCharacterAbilityService =
  {
    async addAbility(rpgId, characterId, userId, params) {
      try {
        await assertCanManageNpcMonsterAbility(rpgId, userId)

        await prisma.$transaction(async (tx) => {
          const characterRows = await tx.$queryRaw<
            CharacterLockedRow[]
          >(Prisma.sql`
          SELECT
            c.id,
            c.rpg_id AS "rpgId",
            r.owner_id AS "ownerId",
            c.character_type AS "characterType",
            COALESCE(c.abilities, '[]'::jsonb) AS abilities
          FROM rpg_characters c
          INNER JOIN rpgs r ON r.id = c.rpg_id
          WHERE c.id = ${characterId}
            AND c.rpg_id = ${rpgId}
          FOR UPDATE
        `)

          const character = characterRows[0]
          if (!character) {
            throw new AppError("Personagem nao encontrado.", 404)
          }
          if (character.characterType === "player") {
            throw new AppError(
              "Use a ficha do player para gerenciar habilidades de player.",
              400,
            )
          }

          const levelRows = await tx.$queryRaw<
            Array<{ levelNumber: number }>
          >(Prisma.sql`
          SELECT level_number AS "levelNumber"
          FROM skill_levels
          WHERE skill_id = ${params.skillId}
            AND level_number = ${params.level}
            AND EXISTS (
              SELECT 1
              FROM skills s
              WHERE s.id = ${params.skillId}
                AND s.rpg_id = ${rpgId}
            )
          LIMIT 1
        `)
          if (!levelRows[0]) {
            throw new AppError("Habilidade nao encontrada neste RPG.", 404)
          }

          const ownedAbilities = parseCharacterAbilities(character.abilities)
          if (
            ownedAbilities.some(
              (item) =>
                item.skillId === params.skillId && item.level === params.level,
            )
          ) {
            throw new AppError(
              "Personagem ja possui este level da habilidade.",
              409,
            )
          }
          if (params.level > 1) {
            const hasPreviousLevel = ownedAbilities.some(
              (item) =>
                item.skillId === params.skillId &&
                item.level === params.level - 1,
            )
            if (!hasPreviousLevel) {
              throw new AppError(
                `Para adicionar o level ${params.level}, primeiro adicione o level ${params.level - 1}.`,
                400,
              )
            }
          }

          const nextAbilities = [
            ...ownedAbilities.filter((item) => item.skillId !== params.skillId),
            { skillId: params.skillId, level: params.level },
          ]

          await tx.rpgCharacter.update({
            where: { id: character.id },
            data: {
              abilities: nextAbilities as Prisma.InputJsonValue,
              updatedAt: new Date(),
            },
          })
        })

        const ability = await loadOwnedAbility(
          rpgId,
          characterId,
          userId,
          params.skillId,
          params.level,
        )
        return { success: true as const, ability }
      } catch (error) {
        if (error instanceof AppError) throw error
        mapSchemaErrors(error, "Erro interno ao adicionar habilidade.")
      }
    },

    async removeAbility(rpgId, characterId, userId, params) {
      try {
        await assertCanManageNpcMonsterAbility(rpgId, userId)

        await prisma.$transaction(async (tx) => {
          const characterRows = await tx.$queryRaw<
            CharacterLockedRow[]
          >(Prisma.sql`
          SELECT
            c.id,
            c.rpg_id AS "rpgId",
            r.owner_id AS "ownerId",
            c.character_type AS "characterType",
            COALESCE(c.abilities, '[]'::jsonb) AS abilities
          FROM rpg_characters c
          INNER JOIN rpgs r ON r.id = c.rpg_id
          WHERE c.id = ${characterId}
            AND c.rpg_id = ${rpgId}
          FOR UPDATE
        `)

          const character = characterRows[0]
          if (!character) {
            throw new AppError("Personagem nao encontrado.", 404)
          }
          if (character.characterType === "player") {
            throw new AppError(
              "Use a ficha do player para gerenciar habilidades de player.",
              400,
            )
          }

          const ownedAbilities = parseCharacterAbilities(character.abilities)
          const hasAbility = ownedAbilities.some(
            (item) =>
              item.skillId === params.skillId && item.level === params.level,
          )
          if (!hasAbility) {
            throw new AppError("Habilidade nao encontrada no personagem.", 404)
          }

          const nextAbilities = ownedAbilities.filter(
            (item) =>
              !(item.skillId === params.skillId && item.level === params.level),
          )

          await tx.rpgCharacter.update({
            where: { id: character.id },
            data: {
              abilities: nextAbilities as Prisma.InputJsonValue,
              updatedAt: new Date(),
            },
          })
        })

        return { success: true as const }
      } catch (error) {
        if (error instanceof AppError) throw error
        mapSchemaErrors(error, "Erro interno ao remover habilidade.")
      }
    },
  }
