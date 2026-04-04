import { deleteScopedImage, uploadScopedImage } from "@/application/media/use-cases/scopedImages"
import { imageKitScopedImageService } from "@/infrastructure/media/imageKitScopedImageService"
import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

type Config = {
  folder: string
  defaultFileName: string
  allowDelete?: boolean
}

export function createScopedImageHandlers(config: Config) {
  async function postHandler(request: Request) {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    try {
      const formData = await request.formData()
      const file = formData.get("file")
      const oldUrl = formData.get("oldUrl")
      const fileName =
        file instanceof File && file.name.trim().length > 0 ? file.name.trim() : config.defaultFileName

      const payload = await uploadScopedImage(
        { service: imageKitScopedImageService },
        {
          userId,
          folder: config.folder,
          fileName,
          file,
          oldUrl,
        },
      )

      return jsonResponse(
        {
          message: "Imagem enviada com sucesso.",
          url: payload.url,
          fileId: payload.fileId,
          thumbnailUrl: payload.thumbnailUrl,
        },
        { status: 201 },
      )
    } catch (error) {
      return toErrorResponse(error, "Erro interno ao enviar imagem.")
    }
  }

  if (!config.allowDelete) {
    return { postHandler }
  }

  async function deleteHandler(request: Request) {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    try {
      const body = (await request.json()) as { url?: unknown }
      await deleteScopedImage(
        { service: imageKitScopedImageService },
        {
          userId,
          folder: config.folder,
          url: body.url,
        },
      )

      return jsonResponse({ message: "Imagem removida com sucesso." }, { status: 200 })
    } catch (error) {
      return toErrorResponse(error, "Erro interno ao remover imagem.")
    }
  }

  return { postHandler, deleteHandler }
}
