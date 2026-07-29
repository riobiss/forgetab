import type { MarkerSectionSyncGateway } from "@/features/world/location/application/contracts/MarkerSectionSyncGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"

export const httpPublicMarkerSectionSyncGateway: MarkerSectionSyncGateway = {
  async update(params) {
    const response = await apiFetch(
      `/api/rpg/${encodeURIComponent(params.rpgId)}/maps/${encodeURIComponent(params.mapId)}/marker-groups/${encodeURIComponent(params.groupId)}/markers/${encodeURIComponent(params.markerId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params.update),
      },
    )
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string
    }
    if (!response.ok) {
      throw new Error(
        payload.message ??
          `${response.status} ${response.statusText || "Request failed"}`,
      )
    }
  },
}
