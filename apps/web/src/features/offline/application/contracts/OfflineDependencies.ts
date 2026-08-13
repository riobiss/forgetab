import type { OfflineSnapshotGateway } from "./OfflineSnapshotGateway"
import type { OfflineSnapshotRepository } from "./OfflineSnapshotRepository"

export type OfflineDependencies = {
  gateway: OfflineSnapshotGateway
  repository: OfflineSnapshotRepository
}
