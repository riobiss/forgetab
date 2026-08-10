import type { MarkerSectionSyncGateway } from "@/features/world/location/application/contracts/MarkerSectionSyncGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { ensureApiResponse } from "@/features/http/infrastructure/parseApiResponse"

export const httpPublicMarkerSectionSyncGateway: MarkerSectionSyncGateway = {
  async update(params) {
    const response = await apiFetch(
      `/api/rpg/${encodeURIComponent(params.rpgId)}/maps/${encodeURIComponent(params.mapId)}/marker-groups/${encodeURIComponent(params.groupId)}/markers/${encodeURIComponent(params.markerId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.update)
      }
    )
    await ensureApiResponse(response, {
      fallbackMessage: `${response.status} ${response.statusText || "Request failed"}`
    })
  }
}
