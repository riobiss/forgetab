import type { RpgMapGateway } from "@/application/rpgMap/contracts/RpgMapGateway"

type ErrorPayload = { message?: string; url?: string; mapImage?: string | null }

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.")
  }
  return payload
}

export const httpRpgMapGateway: RpgMapGateway = {
  async saveMapImage(rpgId, mapImage) {
    const response = await fetch(`/api/rpg/${rpgId}/map`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapImage }),
    })
    return parseJsonResponse<{ message?: string; mapImage: string | null }>(response)
  },

  async uploadMapImage(file, oldUrl) {
    const formData = new FormData()
    formData.append("file", file)
    if (oldUrl) {
      formData.append("oldUrl", oldUrl)
    }

    const response = await fetch("/api/uploads/map-image", {
      method: "POST",
      body: formData,
    })
    return parseJsonResponse<{ url: string; message?: string }>(response)
  },

  async deleteMapImage(url) {
    const response = await fetch("/api/uploads/map-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    return parseJsonResponse<{ message?: string }>(response)
  },
}
