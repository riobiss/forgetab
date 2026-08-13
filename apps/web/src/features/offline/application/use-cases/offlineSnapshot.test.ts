import { describe, expect, it, vi } from "vitest"
import {
  clearOfflineSnapshotUseCase,
  loadOfflineSnapshotUseCase,
  synchronizeOfflineSnapshotUseCase
} from "./offlineSnapshot"

const snapshot = {
  version: 1 as const,
  syncedAt: "2026-08-12T12:00:00.000Z",
  campaigns: []
}

describe("offline snapshot use cases", () => {
  it("salva o snapshot retornado pelo gateway", async () => {
    const gateway = { fetchSnapshot: vi.fn().mockResolvedValue(snapshot) }
    const repository = {
      load: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn()
    }

    await expect(
      synchronizeOfflineSnapshotUseCase({ gateway, repository })
    ).resolves.toEqual(snapshot)
    expect(repository.save).toHaveBeenCalledWith(snapshot)
  })

  it("delega leitura e limpeza ao repositorio local", async () => {
    const repository = {
      load: vi.fn().mockResolvedValue(snapshot),
      save: vi.fn(),
      clear: vi.fn().mockResolvedValue(undefined)
    }

    await expect(loadOfflineSnapshotUseCase(repository)).resolves.toEqual(
      snapshot
    )
    await clearOfflineSnapshotUseCase(repository)
    expect(repository.clear).toHaveBeenCalledOnce()
  })
})
