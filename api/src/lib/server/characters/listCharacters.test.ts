import { describe, expect, it, vi } from "vitest"
import { listCharacters } from "./listCharacters"
import type { CharacterRepository } from "./repositories/characterRepository"
import type { RpgAccess } from "./types"

const baseAccess: RpgAccess = {
  exists: true,
  canAccess: true,
  isOwner: true,
  useRaceBonuses: false,
  useClassBonuses: false,
  useInventoryWeightLimit: false,
  allowMultiplePlayerCharacters: false,
  progressionMode: "xp_level",
  progressionTiers: [{ label: "Level 1", required: 0 }],
}

function makeRepository(): CharacterRepository {
  return {
    listByRpg: vi.fn(),
    countPlayersByCreator: vi.fn(),
    create: vi.fn(),
  }
}

describe("listCharacters", () => {
  it("retorna payload com personagens e flags", async () => {
    const repository = makeRepository()
    vi.mocked(repository.listByRpg).mockResolvedValue([
      {
        id: "char-1",
        rpgId: "rpg-1",
        name: "Heroi",
        image: null,
        raceKey: null,
        classKey: null,
        characterType: "player",
        visibility: "public",
        maxCarryWeight: null,
        progressionMode: "xp_level",
        progressionLabel: "Level 1",
        progressionRequired: 0,
        progressionCurrent: 0,
        createdByUserId: null,
        life: 10,
        defense: 5,
        mana: 3,
        exhaustion: 0,
        sanity: 10,
        statuses: {},
        currentStatuses: {},
        attributes: {},
        skills: {},
        identity: {},
        characteristics: {},
        createdAt: new Date("2026-02-26T00:00:00.000Z"),
        updatedAt: new Date("2026-02-26T00:00:00.000Z"),
      },
    ])

    const result = await listCharacters({
      rpgId: "rpg-1",
      userId: "user-1",
      access: baseAccess,
      characterRepository: repository,
    })

    expect(result.characters).toHaveLength(1)
    expect(result.isOwner).toBe(true)
    expect(result.progressionMode).toBe("xp_level")
  })

  it("mapeia erro de tabela inexistente", async () => {
    const repository = makeRepository()
    vi.mocked(repository.listByRpg).mockRejectedValue(
      new Error('relation "rpg_characters" does not exist'),
    )

    await expect(
      listCharacters({
        rpgId: "rpg-1",
        userId: "user-1",
        access: baseAccess,
        characterRepository: repository,
      }),
    ).rejects.toMatchObject({
      status: 500,
      message: "Tabela de personagens nao existe no banco. Rode a migration.",
    })
  })
})
