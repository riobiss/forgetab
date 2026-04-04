import { describe, expect, it, vi } from "vitest"
import { createCharactersService } from "./index"
import type { CharacterRepository } from "./repositories/characterRepository"
import type { RpgAccessRepository } from "./repositories/rpgAccessRepository"
import type { RpgTemplatesRepository } from "./repositories/rpgTemplatesRepository"
import type { RpgAccess } from "./types"

function makeRpgAccessRepository(): RpgAccessRepository {
  return {
    getRpgAccessRow: vi.fn().mockResolvedValue({
      ownerId: "user-1",
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }],
    }),
    getMembership: vi.fn().mockResolvedValue(null),
  }
}

function makeCharacterRepository(): CharacterRepository {
  return {
    listByRpg: vi.fn().mockResolvedValue([]),
    countPlayersByCreator: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({
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
      life: 0,
      defense: 0,
      mana: 0,
      exhaustion: 0,
      sanity: 0,
      statuses: {},
      currentStatuses: {},
      attributes: {},
      skills: {},
      identity: {},
      characteristics: {},
      createdAt: new Date("2026-02-26T00:00:00.000Z"),
      updatedAt: new Date("2026-02-26T00:00:00.000Z"),
    }),
  }
}

function makeTemplatesRepository(): RpgTemplatesRepository {
  return {
    getAttributeTemplates: vi.fn().mockResolvedValue([]),
    getStatusTemplates: vi.fn().mockResolvedValue([]),
    getSkillTemplates: vi.fn().mockResolvedValue([]),
    getIdentityTemplates: vi.fn().mockResolvedValue([]),
    getCharacteristicTemplates: vi.fn().mockResolvedValue([]),
    getRaceTemplates: vi.fn().mockResolvedValue([]),
    getClassTemplates: vi.fn().mockResolvedValue([]),
  }
}

describe("createCharactersService", () => {
  it("encadeia getRpgAccess, listCharacters e createCharacter com dependencias injetadas", async () => {
    const rpgAccessRepository = makeRpgAccessRepository()
    const characterRepository = makeCharacterRepository()
    const rpgTemplatesRepository = makeTemplatesRepository()

    const service = createCharactersService({
      rpgAccessRepository,
      characterRepository,
      rpgTemplatesRepository,
    })

    const access = await service.getRpgAccess("rpg-1", "user-1")
    expect(access.exists).toBe(true)

    const listResult = await service.listCharacters("rpg-1", "user-1", access)
    expect(listResult.characters).toEqual([])
    expect(characterRepository.listByRpg).toHaveBeenCalledWith({
      rpgId: "rpg-1",
      userId: "user-1",
      isOwner: true,
    })

    const created = await service.createCharacter(
      "rpg-1",
      "user-1",
      access as RpgAccess,
      { name: "Heroi", characterType: "player" },
    )
    expect(created.name).toBe("Heroi")
    expect(characterRepository.create).toHaveBeenCalledTimes(1)
  })
})
