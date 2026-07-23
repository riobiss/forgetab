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

describe("characterManagementService.updateCharacter", () => {
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
        life: 9,
        defense: 0,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: { life: 9 },
        attributes: {},
        skills: { furtividade: 4 },
        currentStatuses: { life: 9 },
        identity: { nome: "Goblin" },
        characteristics: { descricao: "Antigo" },
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
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    await expect(
      characterManagementService.updateCharacter({
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

    expect(mocks.queryRaw).toHaveBeenCalledTimes(4)
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
        life: 10,
        defense: 1,
        mana: 0,
        exhaustion: 0,
        sanity: 0,
        statuses: {
          life: 10,
          defense: 1,
          mana: 0,
          exhaustion: 0,
          sanity: 0,
        },
        attributes: { forca: 1 },
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
    mocks.queryRaw.mockResolvedValueOnce([
      { key: "forca", label: "Forca", position: 0 },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      { key: "life", label: "Vida", position: 0 },
      { key: "defense", label: "Defesa", position: 1 },
      { key: "mana", label: "Mana", position: 2 },
      { key: "exhaustion", label: "Exaustao", position: 3 },
      { key: "sanity", label: "Sanidade", position: 4 },
    ])
    mocks.queryRaw.mockResolvedValueOnce([
      { key: "furtividade", label: "Furtividade", position: 0 },
    ])
    mocks.queryRaw.mockResolvedValueOnce([{ id: "char-1" }])

    await expect(
      characterManagementService.updateCharacter({
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

    expect(mocks.queryRaw).toHaveBeenCalledTimes(7)
  })
})
