import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { characterManagementService } from "./characterManagementService"

describe("characterManagementService.deleteCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deleta personagem quando permissao e consulta basica passam", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Goblin",
        image: "https://cdn.example.com/goblin.png",
        raceKey: null,
        classKey: null,
        characterType: "npc",
        visibility: "private",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        createdByUserId: null,
        life: 0,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {},
        attributes: {},
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        ownerId: "user-1",
        useRaceBonuses: false,
        useClassBonuses: false,
        useInventoryWeightLimit: false,
        allowMultiplePlayerCharacters: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ image: "https://cdn.example.com/goblin.png" }])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    await expect(
      characterManagementService.deleteCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
      }),
    ).resolves.toBeUndefined()

    expect(mocks.queryRaw).toHaveBeenCalledTimes(5)
  })

  it("retorna erro quando personagem nao e encontrado na exclusao", async () => {
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "rpg-1",
        ownerId: "user-1",
        useInventoryWeightLimit: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Goblin",
        image: null,
        raceKey: null,
        classKey: null,
        characterType: "npc",
        visibility: "private",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        createdByUserId: null,
        life: 0,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {},
        attributes: {},
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      {
        ownerId: "user-1",
        useRaceBonuses: false,
        useClassBonuses: false,
        useInventoryWeightLimit: false,
        allowMultiplePlayerCharacters: false,
        progressionMode: "xp_level",
        progressionTiers: [{ label: "Level 1", required: 0 }],
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ image: null }])
    mocks.queryRaw.mockResolvedValueOnce([])

    await expect(
      characterManagementService.deleteCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({
      status: 404,
      message: "Personagem nao encontrado.",
    })
  })
})
