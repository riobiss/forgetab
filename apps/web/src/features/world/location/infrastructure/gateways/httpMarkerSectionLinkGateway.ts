import type { MarkerSectionLinkGateway } from "@/features/world/location/application/contracts/MarkerSectionLinkGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

export const httpMarkerSectionLinkGateway: MarkerSectionLinkGateway = {
  async setLink(params) {
    const response = await apiFetch(
      `/api/rpg/${encodeURIComponent(params.rpgId)}/maps/${encodeURIComponent(params.mapId)}/marker-links/${encodeURIComponent(params.marker.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: params.sectionId,
          marker: params.marker
        })
      }
    )
    const payload = await parseApiResponse<{
      markerId?: string
      sectionId?: string | null
    }>(response, {
      fallbackMessage: `${response.status} ${response.statusText || "Request failed"}`,
      invalidResponseMessage: "Resposta invalida ao vincular marcador."
    })
    if (!payload.markerId || payload.sectionId === undefined) {
      throw new Error("Resposta invalida ao vincular marcador.")
    }
    return {
      markerId: payload.markerId,
      sectionId: payload.sectionId
    }
  }
}
