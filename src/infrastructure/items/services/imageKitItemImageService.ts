import type { ItemImageService } from "@/application/itemImages/ports/ItemImageService"
import { AppError } from "@/shared/errors/AppError"

function buildUserFolder(userId: string) {
  return `/forgetab/users/${userId}/items`
}

function getImageKitConfig() {
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

  return { privateKey, urlEndpoint }
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
  rawOldUrl: unknown,
  allowedFolderPath: string,
) {
  if (typeof rawOldUrl !== "string") return

  const oldUrl = rawOldUrl.trim()
  if (!oldUrl) return

  const endpointHost = parseHost(urlEndpoint)
  const oldUrlHost = parseHost(oldUrl)
  if (!endpointHost || !oldUrlHost || endpointHost !== oldUrlHost) {
    return
  }

  const normalizedOldPath = normalizeUrlPath(oldUrl)
  const allowedPrefix = allowedFolderPath.endsWith("/") ? allowedFolderPath : `${allowedFolderPath}/`
  if (!normalizedOldPath || !normalizedOldPath.startsWith(allowedPrefix)) {
    return
  }

  const fileName = extractFileNameFromUrl(oldUrl)
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
    if (item.url === oldUrl) return true

    const itemPath = normalizeUrlPath(item.url)
    return Boolean(
      normalizedOldPath &&
        itemPath &&
        itemPath === normalizedOldPath &&
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

export const imageKitItemImageService: ItemImageService = {
  async uploadItemImage({ userId, file, oldUrl }) {
    const { privateKey, urlEndpoint } = getImageKitConfig()
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const safeName = file.name?.trim() || "item-image.jpg"
    const userFolder = buildUserFolder(userId)

    const uploadPayload = new FormData()
    uploadPayload.append("file", `data:${file.type};base64,${base64}`)
    uploadPayload.append("fileName", safeName)
    uploadPayload.append("folder", userFolder)
    uploadPayload.append("useUniqueFileName", "true")

    const auth = Buffer.from(`${privateKey}:`, "utf8").toString("base64")

    await deleteImageKitFileByUrl(privateKey, urlEndpoint, oldUrl, userFolder)

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
  },

  async deleteItemImageByUrl({ userId, url }) {
    const { privateKey, urlEndpoint } = getImageKitConfig()
    await deleteImageKitFileByUrl(privateKey, urlEndpoint, url, buildUserFolder(userId))
  },
}
