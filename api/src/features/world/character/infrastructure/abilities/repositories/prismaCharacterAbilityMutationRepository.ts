import { Prisma } from "../../../../../../../generated/prisma/client.js"
import type {
  CharacterAbilityMutationContext,
  CharacterAbilityMutationRepository,
} from "@/features/world/character/application/abilities/ports/CharacterAbilityMutationRepository"
import { toCharacterRepositoryError } from "@/features/world/character/infrastructure/repositories/characterPersistenceErrors"
import { prisma } from "@/lib/prisma"

type CharacterLockedRow = NonNullable<
  CharacterAbilityMutationContext["character"]
>

class CharacterAbilityDecisionError {
  constructor(readonly cause: unknown) {}
}

export const prismaCharacterAbilityMutationRepository: CharacterAbilityMutationRepository =
  {
    async mutate(params, decide) {
      try {
        return await prisma.$transaction(async (tx) => {
          const rows = await tx.$queryRaw<CharacterLockedRow[]>(Prisma.sql`
            SELECT
              c.id,
              c.rpg_id AS "rpgId",
              r.owner_id AS "ownerId",
              c.created_by_user_id AS "createdByUserId",
              c.class_key AS "classKey",
              c.character_type AS "characterType",
              COALESCE(c.skill_points, 0) AS "skillPoints",
              COALESCE(c.abilities, '[]'::jsonb) AS abilities,
              COALESCE(r.costs_enabled, false) AS "costsEnabled"
            FROM rpg_characters c
            INNER JOIN rpgs r ON r.id = c.rpg_id
            WHERE c.id = ${params.characterId}
              AND (${params.rpgId ?? null}::text IS NULL OR c.rpg_id = ${params.rpgId ?? null})
            FOR UPDATE
          `)
          const character = rows[0] ?? null

          const levelRows = await tx.$queryRaw<
            Array<{ cost: Prisma.JsonValue }>
          >(Prisma.sql`
            SELECT cost
            FROM skill_levels
            WHERE skill_id = ${params.skillId}
              AND level_number = ${params.level}
            LIMIT 1
          `)

          let skillBelongsToCharacterClass = false
          if (character?.classKey) {
            const classRows = await tx.$queryRaw<Array<{ allowed: boolean }>>(
              Prisma.sql`
                SELECT true AS allowed
                FROM skills s
                INNER JOIN skill_class_links scl ON scl.skill_id = s.id
                INNER JOIN rpg_class_templates ct ON ct.id = scl.class_template_id
                WHERE s.id = ${params.skillId}
                  AND s.rpg_id = ${character.rpgId}
                  AND ct.rpg_id = ${character.rpgId}
                  AND (ct.key = ${character.classKey} OR ct.id = ${character.classKey})
                LIMIT 1
              `,
            )
            skillBelongsToCharacterClass = Boolean(classRows[0])
          }

          const level = levelRows[0]
          let mutation
          try {
            mutation = decide({
              character,
              skillLevelExists: Boolean(level),
              skillLevelCost: level?.cost ?? null,
              skillBelongsToCharacterClass,
            })
          } catch (error) {
            throw new CharacterAbilityDecisionError(error)
          }

          if (!character) {
            throw new Error("Character mutation requires an existing character")
          }

          const updated = await tx.rpgCharacter.update({
            where: { id: character.id },
            data: {
              abilities: mutation.abilities as Prisma.InputJsonValue,
              skillPoints:
                mutation.skillPointsDelta === undefined
                  ? undefined
                  : { increment: mutation.skillPointsDelta },
              updatedAt: new Date(),
            },
            select: { skillPoints: true },
          })

          return { remainingPoints: updated.skillPoints ?? 0 }
        })
      } catch (error) {
        if (error instanceof CharacterAbilityDecisionError) {
          throw error.cause
        }
        throw toCharacterRepositoryError(error)
      }
    },
  }
