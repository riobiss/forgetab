import { prisma } from "@/lib/prisma"
import { Prisma } from "../../../../../generated/prisma/client.js"
import { fail, rethrowCharacterDeleteInfrastructureError } from "@/infrastructure/characters/services/characterManagementErrors"
import { resolveCharacterManagementPermission } from "@/infrastructure/characters/services/characterManagementPermission"
import { cleanupCharacterImage } from "@/infrastructure/characters/services/characterManagementSupport"

export async function deleteCharacterWithLegacyManagement(params: {
  rpgId: string
  characterId: string
  userId: string
}) {
  try {
    const { rpgId, characterId, userId } = params

    const permission = await resolveCharacterManagementPermission({ rpgId, characterId, userId })

    const isOwner = permission.isOwner
    let imageUrl: string | null = null

    try {
      const currentCharacter = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
        SELECT image
        FROM rpg_characters
        WHERE id = ${characterId}
          AND rpg_id = ${rpgId}
        LIMIT 1
      `)
      imageUrl = currentCharacter[0]?.image ?? null
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('column "image" does not exist'))) {
        throw error
      }
    }

    const deleted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
        ${isOwner ? Prisma.empty : Prisma.sql`AND created_by_user_id = ${userId}`}
      RETURNING id
    `)

    if (deleted.length === 0) {
      fail(404, "Personagem nao encontrado.")
    }

    await cleanupCharacterImage(permission, imageUrl, null)
  } catch (error) {
    rethrowCharacterDeleteInfrastructureError(error)
  }
}
