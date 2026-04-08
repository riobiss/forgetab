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
        name: "Goblin",
        characterType: "npc",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
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

    expect(mocks.queryRaw).toHaveBeenCalledTimes(4)
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
        name: "Goblin",
        characterType: "npc",
        createdByUserId: null,
        skills: {},
        currentStatuses: {},
        identity: {},
        characteristics: {},
        progressionCurrent: 0,
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
