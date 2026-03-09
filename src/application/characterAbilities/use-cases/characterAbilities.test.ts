import { describe, expect, it, vi } from "vitest"
import {
  loadCharacterAbilitiesUseCase,
  removeCharacterAbilityUseCase,
} from "@/application/characterAbilities/use-cases/characterAbilities"
import type { CharacterAbilitiesRepository } from "@/application/characterAbilities/ports/CharacterAbilitiesRepository"
import type { CharacterAbilitiesParserService } from "@/application/characterAbilities/ports/CharacterAbilitiesParserService"
import type { RpgAccessRepository } from "@/application/characters/ports/RpgAccessRepository"

function createRepositoryMock(): CharacterAbilitiesRepository {
  return {
    getRpg: vi.fn(),
    getCharacter: vi.fn(),
    getClassByKey: vi.fn(),
    listPurchasedSkillLevels: vi.fn(),
    listSkillClassLinks: vi.fn(),
    listSkillRaceLinks: vi.fn(),
  }
}

describe("characterAbilities use-cases", () => {
  it("retorna null quando viewer nao pode ver abilities", async () => {
    const repository = createRepositoryMock()
    const rpgAccessRepository: RpgAccessRepository = {
      getRpgAccessRow: vi.fn(),
      getMembership: vi.fn(),
    }
    const parserService: CharacterAbilitiesParserService = {
      parseCharacterAbilities: vi.fn(),
      parseCostPoints: vi.fn(),
    }

    vi.mocked(repository.getRpg).mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "public",
    })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      rpgId: "rpg-1",
      name: "Arthas",
      classKey: null,
      visibility: "public",
      characterType: "player",
      createdByUserId: "another-user",
      abilities: [],
    })

    const result = await loadCharacterAbilitiesUseCase(
      { repository, rpgAccessRepository, parserService },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-1" },
    )

    expect(result).toBeNull()
  })

  it("monta o view model de abilities", async () => {
    const repository = createRepositoryMock()
    const rpgAccessRepository: RpgAccessRepository = {
      getRpgAccessRow: vi.fn(),
      getMembership: vi.fn(),
    }
    const parserService: CharacterAbilitiesParserService = {
      parseCharacterAbilities: vi.fn().mockReturnValue([{ skillId: "skill-1", level: 1 }]),
      parseCostPoints: vi.fn().mockReturnValue(2),
    }

    vi.mocked(repository.getRpg).mockResolvedValue({
      id: "rpg-1",
      ownerId: "owner-1",
      visibility: "public",
    })
    vi.mocked(repository.getCharacter).mockResolvedValue({
      id: "char-1",
      rpgId: "rpg-1",
      name: "Arthas",
      classKey: "warrior",
      visibility: "public",
      characterType: "player",
      createdByUserId: "user-1",
      abilities: [],
    })
    vi.mocked(repository.getClassByKey).mockResolvedValue({
      id: "class-1",
      key: "warrior",
      label: "Guerreiro",
    })
    vi.mocked(repository.listPurchasedSkillLevels).mockResolvedValue([
      {
        skillId: "skill-1",
        skillName: "golpe-pesado",
        skillDescription: "Ataque.",
        skillCategory: "tecnicas",
        skillType: "attack",
        skillActionType: "action",
        skillTags: ["melee"],
        levelNumber: 1,
        levelRequired: 1,
        summary: "Resumo",
        stats: { name: "Golpe Pesado", damage: "1d10" },
        cost: { points: 2 },
        target: {},
        area: {},
        scaling: {},
        requirement: {},
      },
    ])
    vi.mocked(repository.listSkillClassLinks).mockResolvedValue([
      { skillId: "skill-1", classLabel: "Guerreiro" },
    ])
    vi.mocked(repository.listSkillRaceLinks).mockResolvedValue([
      { skillId: "skill-1", raceLabel: "Humano" },
    ])

    const result = await loadCharacterAbilitiesUseCase(
      { repository, rpgAccessRepository, parserService },
      { rpgId: "rpg-1", characterId: "char-1", userId: "user-1" },
    )

    expect(result).not.toBeNull()
    expect(result?.classLabel).toBe("Guerreiro")
    expect(result?.abilities).toHaveLength(1)
    expect(result?.abilities[0]).toMatchObject({
      skillId: "skill-1",
      levelName: "Golpe Pesado",
      pointsCost: 2,
      allowedClasses: ["Guerreiro"],
      allowedRaces: ["Humano"],
    })
  })

  it("delegates ability removal to gateway", async () => {
    const deps = {
      gateway: {
        removeAbility: vi.fn().mockResolvedValue({ success: true }),
      },
    }

    const result = await removeCharacterAbilityUseCase(deps, {
      characterId: "char-1",
      skillId: "skill-1",
      level: 2,
    })

    expect(deps.gateway.removeAbility).toHaveBeenCalledWith("char-1", {
      skillId: "skill-1",
      level: 2,
    })
    expect(result).toEqual({ success: true })
  })
})
