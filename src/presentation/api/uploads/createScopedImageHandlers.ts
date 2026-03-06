import { NextRequest, NextResponse } from "next/server"
import { deleteScopedImage, uploadScopedImage } from "@/application/media/use-cases/scopedImages"
import { imageKitScopedImageService } from "@/infrastructure/media/imageKitScopedImageService"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { AppError } from "@/shared/errors/AppError"

type Config = {
  folder: string
  defaultFileName: string
  allowDelete?: boolean
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export function createScopedImageHandlers(config: Config) {
  async function POST(request: NextRequest) {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
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

      return NextResponse.json(
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
    return { POST }
  }

  async function DELETE(request: NextRequest) {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
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

      return NextResponse.json({ message: "Imagem removida com sucesso." }, { status: 200 })
    } catch (error) {
      return toErrorResponse(error, "Erro interno ao remover imagem.")
    }
  }

  return { POST, DELETE }
}
