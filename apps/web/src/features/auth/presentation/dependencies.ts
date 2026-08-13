import { httpAuthClientGateway } from "@/features/auth/infrastructure/gateways/httpAuthClientGateway"
import { browserAuthSession } from "@/features/session/infrastructure/services/browserAuthSession"
import { indexedDbOfflineSnapshotRepository } from "@/features/offline/infrastructure/storage/indexedDbOfflineSnapshotRepository"

export const authClientDependencies = {
  gateway: httpAuthClientGateway,
  session: browserAuthSession,
  offlineData: indexedDbOfflineSnapshotRepository
} as const
