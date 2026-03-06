import type {
  ScopedImageDeleteInput,
  ScopedImageService,
  ScopedImageUploadInput,
} from "@/application/media/ports/ScopedImageService"
import { AppError } from "@/shared/errors/AppError"

function getImageKitConfig(): { privateKey: string; urlEndpoint: string } {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  const missing: string[] = []
  if (!privateKey) missing.push("IMAGEKIT_PRIVATE_KEY")
  if (!urlEndpoint) missing.push("IMAGEKIT_URL_ENDPOINT")

  if (missing.length > 0) {
    throw new AppError(
      `ImageKit nao configurado no servidor. Variaveis ausentes: ${missing.join(", ")}.`,
      500,
    )
  }

  return {
    privateKey: privateKey as string,
    urlEndpoint: urlEndpoint as string,
  }
}

function buildUserFolder(userId: string, folder: string) {
  return `/forgetab/users/${userId}/${folder}`
}

function parseHost(value: string) {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

function normalizeUrlPath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return null
  }
}

function extractFileNameFromUrl(value: string) {
  const path = normalizeUrlPath(value)
  if (!path) return null

  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return null

  return parts[parts.length - 1]
}

async function deleteImageKitFileByUrl(
  privateKey: string,
  urlEndpoint: string,
  rawUrl: unknown,
  allowedFolderPath: string,
) {
  if (typeof rawUrl !== "string") return

  const imageUrl = rawUrl.trim()
  if (!imageUrl) return

  const endpointHost = parseHost(urlEndpoint)
  const imageUrlHost = parseHost(imageUrl)
  if (!endpointHost || !imageUrlHost || endpointHost !== imageUrlHost) {
    return
  }

  const normalizedPath = normalizeUrlPath(imageUrl)
  const allowedPrefix = allowedFolderPath.endsWith("/") ? allowedFolderPath : `${allowedFolderPath}/`
  if (!normalizedPath || !normalizedPath.startsWith(allowedPrefix)) {
    return
  }

  const fileName = extractFileNameFromUrl(imageUrl)
  if (!fileName) return

  const auth = Buffer.from(`${privateKey}:`, "utf8").toString("base64")
  const escapedFileName = fileName.replace(/"/g, '\\"')
  const searchQuery = encodeURIComponent(`name = "${escapedFileName}"`)
  const listResponse = await fetch(
    `https://api.imagekit.io/v1/files?limit=100&searchQuery=${searchQuery}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  )

  if (!listResponse.ok) {
    throw new Error("Falha ao listar imagem no ImageKit.")
  }

  const listPayload = (await listResponse.json()) as Array<{
    fileId?: string
    url?: string
  }>

  const target = listPayload.find((item) => {
    if (!item.fileId || !item.url) return false
    if (item.url === imageUrl) return true

    const itemPath = normalizeUrlPath(item.url)
    return Boolean(
      normalizedPath &&
        itemPath &&
        itemPath === normalizedPath &&
        itemPath.startsWith(allowedPrefix),
    )
  })

  if (!target?.fileId) return

  const deleteResponse = await fetch(`https://api.imagekit.io/v1/files/${target.fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    throw new Error("Falha ao remover imagem no ImageKit.")
  }
}

async function deleteByScopedUrl(params: ScopedImageDeleteInput) {
  const { privateKey, urlEndpoint } = getImageKitConfig()
  await deleteImageKitFileByUrl(
    privateKey,
    urlEndpoint,
    params.url,
    buildUserFolder(params.userId, params.folder),
  )
}

async function uploadScopedImageInternal(params: ScopedImageUploadInput) {
  const { privateKey, urlEndpoint } = getImageKitConfig()
  const userFolder = buildUserFolder(params.userId, params.folder)
  const buffer = Buffer.from(await params.file.arrayBuffer())
  const base64 = buffer.toString("base64")

  const uploadPayload = new FormData()
  uploadPayload.append("file", `data:${params.file.type};base64,${base64}`)
  uploadPayload.append("fileName", params.fileName)
  uploadPayload.append("folder", userFolder)
  uploadPayload.append("useUniqueFileName", "true")

  const auth = Buffer.from(`${privateKey}:`, "utf8").toString("base64")

  await deleteImageKitFileByUrl(privateKey, urlEndpoint, params.oldUrl, userFolder)

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
    throw new AppError(payload.message ?? "Falha ao enviar imagem para o ImageKit.", 502)
  }

  return {
    url: payload.url,
    fileId: payload.fileId ?? null,
    thumbnailUrl: payload.thumbnailUrl ?? null,
  }
}

export const imageKitScopedImageService: ScopedImageService = {
  upload: uploadScopedImageInternal,
  deleteByUrl: deleteByScopedUrl,
}
