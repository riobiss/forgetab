import { describe, expect, it, vi } from "vitest"
import { getRpgAccess } from "./access"
import type { RpgAccessRepository } from "./repositories/rpgAccessRepository"

function makeRepository(): RpgAccessRepository {
  return {
    getRpgAccessRow: vi.fn(),
    getMembership: vi.fn(),
  }
}

describe("getRpgAccess", () => {
  it("retorna acesso inexistente quando RPG nao existe", async () => {
    const repository = makeRepository()
    vi.mocked(repository.getRpgAccessRow).mockResolvedValue(null)

    const result = await getRpgAccess({ rpgId: "rpg-1", userId: "user-1", repository })

    expect(result.exists).toBe(false)
    expect(result.canAccess).toBe(false)
    expect(result.isOwner).toBe(false)
  })

  it("retorna owner com acesso total", async () => {
    const repository = makeRepository()
    vi.mocked(repository.getRpgAccessRow).mockResolvedValue({
      ownerId: "user-1",
      useRaceBonuses: true,
      useClassBonuses: true,
      useInventoryWeightLimit: true,
      allowMultiplePlayerCharacters: true,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })

    const result = await getRpgAccess({ rpgId: "rpg-1", userId: "user-1", repository })

    expect(result.exists).toBe(true)
    expect(result.canAccess).toBe(true)
    expect(result.isOwner).toBe(true)
    expect(result.useInventoryWeightLimit).toBe(true)
  })

  it("retorna membro aceito como acessivel e nao owner", async () => {
    const repository = makeRepository()
    vi.mocked(repository.getRpgAccessRow).mockResolvedValue({
      ownerId: "owner-1",
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })
    vi.mocked(repository.getMembership).mockResolvedValue({
      status: "accepted",
      role: "player",
    })

    const result = await getRpgAccess({ rpgId: "rpg-1", userId: "user-1", repository })

    expect(result.exists).toBe(true)
    expect(result.canAccess).toBe(true)
    expect(result.isOwner).toBe(false)
  })

  it("retorna moderador aceito como owner", async () => {
    const repository = makeRepository()
    vi.mocked(repository.getRpgAccessRow).mockResolvedValue({
      ownerId: "owner-1",
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    })
    vi.mocked(repository.getMembership).mockResolvedValue({
      status: "accepted",
      role: "moderator",
    })

    const result = await getRpgAccess({ rpgId: "rpg-1", userId: "user-1", repository })

    expect(result.canAccess).toBe(true)
    expect(result.isOwner).toBe(true)
  })
})
