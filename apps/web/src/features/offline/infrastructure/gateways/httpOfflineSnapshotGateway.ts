import type { OfflineSnapshotGateway } from "@/features/offline/application/contracts/OfflineSnapshotGateway"
import type { OfflineSnapshotDto } from "@forgetab/world-contracts/offline"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

export const httpOfflineSnapshotGateway: OfflineSnapshotGateway = {
  async fetchSnapshot() {
    const response = await apiFetch("/api/offline/snapshot", {
      cache: "no-store"
    })

    return parseApiResponse<OfflineSnapshotDto>(response)
  }
}
