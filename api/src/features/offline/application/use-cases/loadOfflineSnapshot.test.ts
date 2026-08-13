import { describe, expect, it, vi } from "vitest"
import { loadOfflineSnapshotUseCase } from "./loadOfflineSnapshot"

describe("loadOfflineSnapshotUseCase", () => {
  it("reune campanhas e dados offline dos personagens do usuario", async () => {
    const campaignRepository = {
      listAvailableForUser: vi.fn().mockResolvedValue([
        {
          id: "rpg-1",
          title: "A Forja",
          description: "Campanha de teste",
          image: null,
          characters: [{ id: "char-1" }]
        }
      ])
    }
    const characterReader = {
      read: vi.fn().mockResolvedValue({
        id: "char-1",
        name: "Lia",
        image: null,
        characterType: "player",
        classLabel: "Guerreira",
        progressionLevelDisplay: "Nivel 2",
        progressionCurrent: 120,
        statusEntries: [],
        attributeEntries: [],
        skillEntries: [],
        inventory: [],
        abilities: []
      })
    }

    const snapshot = await loadOfflineSnapshotUseCase(
      {
        campaignRepository,
        characterReader,
        now: () => new Date("2026-08-12T12:00:00.000Z")
      },
      { userId: "user-1" }
    )

    expect(snapshot).toMatchObject({
      version: 1,
      syncedAt: "2026-08-12T12:00:00.000Z",
      campaigns: [
        {
          id: "rpg-1",
          characters: [{ id: "char-1", name: "Lia" }]
        }
      ]
    })
    expect(characterReader.read).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "user-1"
    })
  })

  it("ignora personagens cujo acesso deixou de existir", async () => {
    const snapshot = await loadOfflineSnapshotUseCase(
      {
        campaignRepository: {
          listAvailableForUser: vi.fn().mockResolvedValue([
            {
              id: "rpg-1",
              title: "A Forja",
              description: "",
              image: null,
              characters: [{ id: "char-1" }]
            }
          ])
        },
        characterReader: { read: vi.fn().mockResolvedValue(null) }
      },
      { userId: "user-1" }
    )

    expect(snapshot.campaigns[0]?.characters).toEqual([])
  })
})
