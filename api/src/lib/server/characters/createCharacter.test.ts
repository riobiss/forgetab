import { describe, expect, it, vi } from "vitest"
import { createCharacter } from "./createCharacter"
import type { CharacterRepository } from "./repositories/characterRepository"
import type { RpgTemplatesRepository } from "./repositories/rpgTemplatesRepository"
import type { CreateCharacterPayload, RpgAccess } from "./types"

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

function makeCharacterRepository(): CharacterRepository {
  return {
    listByRpg: vi.fn(),
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

describe("createCharacter", () => {
  it("retorna 400 para nome curto", async () => {
    const characterRepository = makeCharacterRepository()
    const rpgTemplatesRepository = makeTemplatesRepository()

    await expect(
      createCharacter({
        rpgId: "rpg-1",
        userId: "user-1",
        access: baseAccess,
        payload: { name: "A", characterType: "player" },
        characterRepository,
        rpgTemplatesRepository,
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Nome deve ter pelo menos 2 caracteres.",
    })
  })

  it("retorna 400 quando jogador tenta criar npc", async () => {
    const characterRepository = makeCharacterRepository()
    const rpgTemplatesRepository = makeTemplatesRepository()

    await expect(
      createCharacter({
        rpgId: "rpg-1",
        userId: "user-1",
        access: { ...baseAccess, isOwner: false },
        payload: { name: "Goblin", characterType: "npc" },
        characterRepository,
        rpgTemplatesRepository,
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Somente personagens do tipo player podem ser criados por jogadores.",
    })
  })

  it("retorna 409 quando jogador ja possui player e RPG nao permite multiplos", async () => {
    const characterRepository = makeCharacterRepository()
    vi.mocked(characterRepository.countPlayersByCreator).mockResolvedValue(1)
    const rpgTemplatesRepository = makeTemplatesRepository()

    await expect(
      createCharacter({
        rpgId: "rpg-1",
        userId: "user-1",
        access: { ...baseAccess, isOwner: false, allowMultiplePlayerCharacters: false },
        payload: { name: "Heroi 2", characterType: "player" },
        characterRepository,
        rpgTemplatesRepository,
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Voce ja possui um personagem player neste RPG.",
    })
  })

  it("cria personagem com sucesso", async () => {
    const characterRepository = makeCharacterRepository()
    const rpgTemplatesRepository = makeTemplatesRepository()

    const payload: CreateCharacterPayload = {
      name: "Heroi",
      characterType: "player",
    }

    const result = await createCharacter({
      rpgId: "rpg-1",
      userId: "user-1",
      access: baseAccess,
      payload,
      characterRepository,
      rpgTemplatesRepository,
    })

    expect(result.name).toBe("Heroi")
    expect(characterRepository.create).toHaveBeenCalledTimes(1)
  })
})
