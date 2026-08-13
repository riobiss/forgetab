import { httpOfflineSnapshotGateway } from "@/features/offline/infrastructure/gateways/httpOfflineSnapshotGateway"
import { indexedDbOfflineSnapshotRepository } from "@/features/offline/infrastructure/storage/indexedDbOfflineSnapshotRepository"

export const offlineDependencies = {
  gateway: httpOfflineSnapshotGateway,
  repository: indexedDbOfflineSnapshotRepository
} as const
