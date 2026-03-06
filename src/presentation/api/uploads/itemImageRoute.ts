import { NextRequest, NextResponse } from "next/server"
import { deleteItemImage, uploadItemImage } from "@/application/itemImages/use-cases/itemImages"
import { imageKitItemImageService } from "@/infrastructure/items/services/imageKitItemImageService"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { AppError } from "@/shared/errors/AppError"

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const oldUrl = formData.get("oldUrl")

    const payload = await uploadItemImage(
      { service: imageKitItemImageService },
      { userId, file, oldUrl },
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

export async function DELETE(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { url?: unknown }
    await deleteItemImage(
      { service: imageKitItemImageService },
      { userId, url: body.url },
    )

    return NextResponse.json({ message: "Imagem removida com sucesso." }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover imagem.")
  }
}
