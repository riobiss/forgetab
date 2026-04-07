import type { ImageGateway } from "@/application/rpgManagement/ports/ImageGateway"
import { mapRpgManagementRepositoryError } from "@/application/rpgManagement/errors/mapRpgManagementRepositoryError"
import type { RpgRepository } from "@/application/rpgManagement/ports/RpgRepository"
import { AppError } from "@/shared/errors/AppError"

type DeleteRpgDependencies = {
  repository: RpgRepository
  imageGateway: ImageGateway
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

    const mapped = mapRpgManagementRepositoryError(error, "Erro interno ao deletar RPG.")
    if (mapped) {
      throw mapped
    }

    throw new AppError("Erro interno ao deletar RPG.", 500)
  }
}
