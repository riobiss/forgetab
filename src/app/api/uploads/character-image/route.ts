import { NextRequest, NextResponse } from "next/server"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  const missing: string[] = []
  if (!privateKey) missing.push("IMAGEKIT_PRIVATE_KEY")
  if (!urlEndpoint) missing.push("IMAGEKIT_URL_ENDPOINT")

  if (missing.length > 0) {
    return { ok: false as const, missing }
  }

  return { ok: true as const, privateKey, urlEndpoint }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const imageKitConfig = getImageKitConfig()
    if (!imageKitConfig.ok) {
      return NextResponse.json(
        {
          message: `ImageKit nao configurado no servidor. Variaveis ausentes: ${imageKitConfig.missing.join(", ")}.`,
        },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Arquivo de imagem e obrigatorio." }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Envie um arquivo de imagem valido." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Imagem muito grande. Limite de 8MB." },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const safeName = file.name?.trim() || "character-image.jpg"

    const uploadPayload = new FormData()
    uploadPayload.append("file", `data:${file.type};base64,${base64}`)
    uploadPayload.append("fileName", safeName)
    uploadPayload.append("folder", "/rpg-web/characters")
    uploadPayload.append("useUniqueFileName", "true")

    // ImageKit upload API uses Basic auth with: base64(privateKey + ":")
    const auth = Buffer.from(`${imageKitConfig.privateKey}:`, "utf8").toString("base64")

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: uploadPayload,
    })

    const payload = (await response.json()) as {
      url?: string
      fileId?: string
      thumbnailUrl?: string
      message?: string
    }

    if (!response.ok || !payload.url) {
      return NextResponse.json(
        { message: payload.message ?? "Falha ao enviar imagem para o ImageKit." },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        message: "Imagem enviada com sucesso.",
        url: payload.url,
        fileId: payload.fileId ?? null,
        thumbnailUrl: payload.thumbnailUrl ?? null,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { message: "Erro interno ao enviar imagem." },
      { status: 500 },
    )
  }
}
