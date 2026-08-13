import type { OfflineSnapshotDto } from "@forgetab/world-contracts/offline"

export interface OfflineSnapshotGateway {
  fetchSnapshot(): Promise<OfflineSnapshotDto>
}
