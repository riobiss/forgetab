import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
  },
}))

import { updateCharacter } from "./updateCharacter"

describe("updateCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("nao recalcula bonus ao salvar apenas campos basicos de npc", async () => {
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
        skills: { furtividade: 4 },
        currentStatuses: { life: 9 },
        identity: { nome: "Goblin" },
        characteristics: { descricao: "Antigo" },
        progressionCurrent: 0,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    await expect(
      updateCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        payload: {
          name: "Goblin Rei",
          visibility: "private",
          identity: { nome: "Goblin Rei" },
          characteristics: { descricao: "Novo lider" },
        },
      }),
    ).resolves.toBeUndefined()

    expect(mocks.queryRaw).toHaveBeenCalledTimes(3)
  })

  it("aceita patch parcial de bonus sem exigir nome para npc", async () => {
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
        skills: { furtividade: 2 },
        currentStatuses: {
          life: 10,
          defense: 1,
          mana: 0,
          exhaustion: 0,
          sanity: 0,
        },
        identity: { nome: "Goblin" },
        characteristics: { descricao: "Velho" },
        progressionCurrent: 0,
      },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      { key: "forca", label: "Forca", position: 0 },
    ])
    mocks.queryRaw.mockResolvedValueOnce([])
    mocks.queryRaw.mockResolvedValueOnce([
      { key: "furtividade", label: "Furtividade", position: 0 },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    await expect(
      updateCharacter({
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        payload: {
          statuses: {
            life: 12,
            defense: 2,
            mana: 0,
            exhaustion: 0,
            sanity: 0,
          },
          attributes: { forca: 3 },
          skills: { furtividade: 5 },
        },
      }),
    ).resolves.toBeUndefined()

    expect(mocks.queryRaw).toHaveBeenCalledTimes(6)
  })
})
