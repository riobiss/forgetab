import type { OfflineSnapshotDto } from "@forgetab/world-contracts/offline"

export interface OfflineSnapshotRepository {
  load(): Promise<OfflineSnapshotDto | null>
  save(snapshot: OfflineSnapshotDto): Promise<void>
  clear(): Promise<void>
}
