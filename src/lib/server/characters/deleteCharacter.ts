import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import {
  buildCharacterFolder,
  canManageCharacter,
  deleteImageKitFileByUrl,
  getImageKitConfig,
} from "./manageCharacter"

type DeleteCharacterInput = {
  rpgId: string
  characterId: string
  userId: string
}

export class DeleteCharacterError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = "DeleteCharacterError"
  }
}

function fail(status: number, message: string): never {
  throw new DeleteCharacterError(status, message)
}

export async function deleteCharacter(input: DeleteCharacterInput): Promise<void> {
  const { rpgId, characterId, userId } = input

  try {
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      fail(permission.status, permission.message)
    }

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

    const imageKitConfig = getImageKitConfig()
    if (imageKitConfig.ok) {
      const allowedFolderPaths = [
        buildCharacterFolder(permission.rpgOwnerId),
        ...(permission.characterCreatedByUserId
          ? [buildCharacterFolder(permission.characterCreatedByUserId)]
          : []),
      ]
      try {
        await deleteImageKitFileByUrl(
          imageKitConfig.privateKey,
          imageKitConfig.urlEndpoint,
          imageUrl,
          allowedFolderPaths,
        )
      } catch {
        // Nao bloqueia a exclusao do personagem caso a limpeza da imagem falhe.
      }
    }
  } catch (error) {
    if (error instanceof DeleteCharacterError) throw error
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
    }
    throw error
  }
}
