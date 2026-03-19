import type { RpgMapGateway } from "@/application/rpgMap/contracts/RpgMapGateway"
import type {
  RpgMapDetailViewDto,
  RpgMapDto,
  RpgMapSectionDto,
  UpsertRpgMapPayloadDto,
  UpsertRpgMapSectionPayloadDto,
} from "@/application/rpgMap/types"

type ErrorPayload = { message?: string; url?: string; mapImage?: string | null }

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & ErrorPayload
  if (!response.ok) {
    throw new Error(payload.message ?? "Request failed.")
  }
  return payload
}

export const httpRpgMapGateway: RpgMapGateway = {
  async fetchMaps(rpgId) {
    return parseJsonResponse<{ maps: RpgMapDto[]; canManage: boolean }>(
      await fetch(`/api/rpg/${rpgId}/maps`),
    )
  },

  async fetchMap(rpgId, mapId) {
    return parseJsonResponse<RpgMapDetailViewDto>(
      await fetch(`/api/rpg/${rpgId}/maps/${mapId}`),
    )
  },

  async createMap(rpgId, payload) {
    const response = await fetch(`/api/rpg/${rpgId}/maps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies UpsertRpgMapPayloadDto),
    })
    const result = await parseJsonResponse<{ map?: RpgMapDto }>(response)
    if (!result.map) throw new Error("Nao foi possivel criar o mapa.")
    return result.map
  },

  async updateMap(rpgId, mapId, payload) {
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies UpsertRpgMapPayloadDto),
    })
    const result = await parseJsonResponse<{ map?: RpgMapDto }>(response)
    if (!result.map) throw new Error("Nao foi possivel atualizar o mapa.")
    return result.map
  },

  async deleteMap(rpgId, mapId) {
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}`, {
      method: "DELETE",
    })
    await parseJsonResponse<{ message?: string }>(response)
  },

  async createSection(rpgId, mapId, payload) {
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies UpsertRpgMapSectionPayloadDto),
    })
    const result = await parseJsonResponse<{ section?: RpgMapSectionDto }>(response)
    if (!result.section) throw new Error("Nao foi possivel criar a secao.")
    return result.section
  },

  async updateSection(rpgId, mapId, sectionId, payload) {
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload satisfies UpsertRpgMapSectionPayloadDto),
    })
    const result = await parseJsonResponse<{ section?: RpgMapSectionDto }>(response)
    if (!result.section) throw new Error("Nao foi possivel atualizar a secao.")
    return result.section
  },

  async deleteSection(rpgId, mapId, sectionId) {
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}/sections/${sectionId}`, {
      method: "DELETE",
    })
    await parseJsonResponse<{ message?: string }>(response)
  },

  async reorderSection(rpgId, mapId, sectionId, direction) {
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}/sections/${sectionId}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    })
    const result = await parseJsonResponse<{ section?: RpgMapSectionDto }>(response)
    if (!result.section) throw new Error("Nao foi possivel reordenar a secao.")
    return result.section
  },

  async saveMapImage(rpgId, mapId, mapImage) {
    const current = await this.fetchMap(rpgId, mapId)
    const response = await fetch(`/api/rpg/${rpgId}/maps/${mapId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: current.map.title,
        description: current.map.description,
        type: current.map.type,
        image: mapImage,
      } satisfies UpsertRpgMapPayloadDto),
    })
    const payload = await parseJsonResponse<{ map?: RpgMapDto }>(response)
    return { mapImage: payload.map?.image ?? mapImage }
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
