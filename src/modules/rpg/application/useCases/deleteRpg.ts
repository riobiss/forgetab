import { Prisma } from "../../../../../generated/prisma/client.js"
import type { ImageGateway } from "@/modules/rpg/contracts/ImageGateway"
import type { RpgRepository } from "@/modules/rpg/contracts/RpgRepository"
import { AppError } from "@/modules/rpg/domain/errors"

type DeleteRpgDependencies = {
  repository: RpgRepository
  imageGateway: ImageGateway
}

function isSchemaOutdatedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('relation "rpgs" does not exist') ||
    error.message.includes('column "image" does not exist') ||
    error.message.includes("Could not find the table")
  )
}

export async function deleteRpg(
  deps: DeleteRpgDependencies,
  params: { rpgId: string; userId: string },
) {
  try {
    let imageUrl: string | null = null

    try {
      imageUrl = await deps.repository.getOwnedImage(params.rpgId, params.userId)
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('column "image" does not exist')) {
        throw error
      }
    }

    const deleted = await deps.repository.deleteOwned(params.rpgId, params.userId)
    if (!deleted) {
      throw new AppError("RPG nao encontrado.", 404)
    }

    try {
      await deps.imageGateway.deleteRpgImageByUrl({ ownerId: params.userId, imageUrl })
    } catch {
      // Nao bloqueia a exclusao do RPG caso a limpeza da imagem falhe.
    }

    return { message: "RPG deletado com sucesso." }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      throw new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
    }

    if (isSchemaOutdatedError(error)) {
      throw new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao deletar RPG.", 500)
  }
}
