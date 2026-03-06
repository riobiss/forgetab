import type { ItemImageService } from "@/application/itemImages/ports/ItemImageService"
import { AppError } from "@/shared/errors/AppError"

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024

type Dependencies = {
  service: ItemImageService
}

export async function uploadItemImage(
  deps: Dependencies,
  params: {
    userId: string
    file: unknown
    oldUrl?: unknown
  },
) {
  try {
    if (!(params.file instanceof File)) {
      throw new AppError("Arquivo de imagem e obrigatorio.", 400)
    }

    if (!params.file.type.startsWith("image/")) {
      throw new AppError("Envie um arquivo de imagem valido.", 400)
    }

    if (params.file.size > MAX_FILE_SIZE_BYTES) {
      throw new AppError("Imagem muito grande. Limite de 8MB.", 400)
    }

    return await deps.service.uploadItemImage({
      userId: params.userId,
      file: params.file,
      oldUrl: params.oldUrl,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError("Erro interno ao enviar imagem.", 500)
  }
}

export async function deleteItemImage(
  deps: Dependencies,
  params: {
    userId: string
    url?: unknown
  },
) {
  try {
    await deps.service.deleteItemImageByUrl({
      userId: params.userId,
      url: params.url,
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError("Erro interno ao remover imagem.", 500)
  }
}
