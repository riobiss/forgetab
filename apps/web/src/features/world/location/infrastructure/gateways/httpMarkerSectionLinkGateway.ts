import type { MarkerSectionLinkGateway } from "@/features/world/location/application/contracts/MarkerSectionLinkGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"

export const httpMarkerSectionLinkGateway: MarkerSectionLinkGateway = {
  async setLink(params) {
    const response = await apiFetch(
      `/api/rpg/${encodeURIComponent(params.rpgId)}/maps/${encodeURIComponent(params.mapId)}/marker-links/${encodeURIComponent(params.marker.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: params.sectionId,
          marker: params.marker,
        }),
      },
    )
    const payload = (await response.json().catch(() => ({}))) as {
      markerId?: string
      sectionId?: string | null
      message?: string
    }
    if (!response.ok) {
      throw new Error(
        payload.message ??
          `${response.status} ${response.statusText || "Request failed"}`,
      )
    }
    if (!payload.markerId || payload.sectionId === undefined) {
      throw new Error("Resposta invalida ao vincular marcador.")
    }
    return {
      markerId: payload.markerId,
      sectionId: payload.sectionId,
    }
  },
}
