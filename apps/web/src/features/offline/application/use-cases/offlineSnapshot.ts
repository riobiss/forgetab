import type { OfflineDependencies } from "../contracts/OfflineDependencies"
import type { OfflineSnapshotRepository } from "../contracts/OfflineSnapshotRepository"

export async function synchronizeOfflineSnapshotUseCase(
  deps: OfflineDependencies
) {
  const snapshot = await deps.gateway.fetchSnapshot()
  await deps.repository.save(snapshot)
  return snapshot
}

export function loadOfflineSnapshotUseCase(
  repository: OfflineSnapshotRepository
) {
  return repository.load()
}

export function clearOfflineSnapshotUseCase(
  repository: OfflineSnapshotRepository
) {
  return repository.clear()
}
