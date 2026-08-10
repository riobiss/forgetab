import type {
  ScopedImageFile,
  ScopedImageFolder,
  ScopedImageService
} from "@/features/media/application/ports/ScopedImageService"
import { AppError } from "@/features/shared/application/errors/AppError"
import {
  isAllowedImageMimeType,
  MAX_IMAGE_FILE_SIZE_BYTES
} from "@forgetab/world-contracts/media"

export { MAX_IMAGE_FILE_SIZE_BYTES } from "@forgetab/world-contracts/media"

type Dependencies = {
  service: ScopedImageService
}

function isScopedImageFile(value: unknown): value is ScopedImageFile {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof (value as ScopedImageFile).type === "string" &&
    typeof (value as ScopedImageFile).size === "number" &&
    typeof (value as ScopedImageFile).arrayBuffer === "function"
  )
}

function normalizeOptionalUrl(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeFileName(value: string) {
  const leafName = value.trim().split(/[\\/]/).pop() ?? ""
  const safeName = leafName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 128)
  return safeName && safeName !== "." && safeName !== ".." ? safeName : "image"
}

export async function uploadScopedImage(
  deps: Dependencies,
  params: {
    userId: string
    folder: ScopedImageFolder
    fileName: string
    file: unknown
    oldUrl?: unknown
  }
) {
  try {
    if (!isScopedImageFile(params.file)) {
      throw new AppError("Arquivo de imagem e obrigatorio.", 400)
    }

    if (!isAllowedImageMimeType(params.file.type)) {
      throw new AppError("Envie um arquivo de imagem valido.", 400)
    }

    if (params.file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
      throw new AppError("Imagem muito grande. Limite de 8MB.", 400)
    }

    return await deps.service.upload({
      userId: params.userId,
      folder: params.folder,
      fileName: normalizeFileName(params.fileName),
      file: params.file,
      oldUrl: normalizeOptionalUrl(params.oldUrl)
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError("Erro interno ao enviar imagem.", 500)
  }
}

export async function deleteScopedImage(
  deps: Dependencies,
  params: {
    userId: string
    folder: ScopedImageFolder
    url?: unknown
  }
) {
  try {
    await deps.service.deleteByUrl({
      userId: params.userId,
      folder: params.folder,
      url: normalizeOptionalUrl(params.url)
    })
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    throw new AppError("Erro interno ao remover imagem.", 500)
  }
}
