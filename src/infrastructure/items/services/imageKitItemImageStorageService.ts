import type { ItemImageStorageService } from "@/application/items/ports/ItemImageStorageService"

function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!privateKey || !urlEndpoint) {
    return { ok: false as const }
  }

  return { ok: true as const, privateKey, urlEndpoint }
}

function buildItemFolder(userId: string) {
  return `/forgetab/users/${userId}/items`
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
  rawUrl: string | null,
  allowedFolderPaths: string[],
) {
  if (!rawUrl) return

  const imageUrl = rawUrl.trim()
  if (!imageUrl) return

  const endpointHost = parseHost(urlEndpoint)
  const imageUrlHost = parseHost(imageUrl)
  if (!endpointHost || !imageUrlHost || endpointHost !== imageUrlHost) {
    return
  }

  const normalizedImagePath = normalizeUrlPath(imageUrl)
  const allowedPrefixes = allowedFolderPaths
    .map((folder) => folder.trim())
    .filter((folder) => folder.length > 0)
    .map((folder) => (folder.endsWith("/") ? folder : `${folder}/`))

  if (
    !normalizedImagePath ||
    allowedPrefixes.length === 0 ||
    !allowedPrefixes.some((prefix) => normalizedImagePath.startsWith(prefix))
  ) {
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
      normalizedImagePath &&
        itemPath &&
        itemPath === normalizedImagePath &&
        allowedPrefixes.some((prefix) => itemPath.startsWith(prefix)),
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

export const imageKitItemImageStorageService: ItemImageStorageService = {
  async deleteItemImageByUrl(userId, imageUrl) {
    const imageKitConfig = getImageKitConfig()
    if (!imageKitConfig.ok) {
      return
    }

    await deleteImageKitFileByUrl(
      imageKitConfig.privateKey,
      imageKitConfig.urlEndpoint,
      imageUrl,
      [buildItemFolder(userId)],
    )
  },
}
