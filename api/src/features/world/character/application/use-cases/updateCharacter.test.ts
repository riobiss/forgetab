import { beforeEach, describe, expect, it, vi } from "vitest"
import type { CharacterImageCleanupService } from "@/features/world/character/application/ports/CharacterImageCleanupService"
import type { CharacterUpdateRepository } from "@/features/world/character/application/ports/CharacterUpdateRepository"
import type { RpgAccessRepository } from "@/features/world/character/application/ports/RpgAccessRepository"
import type { RpgTemplatesRepository } from "@/features/world/character/application/ports/RpgTemplatesRepository"
import type { CharacterRow } from "@/features/world/character/application/types"
import { updateCharacter } from "@/features/world/character/application/use-cases/updateCharacter"

const character: CharacterRow = {
  id: "char-1",
  rpgId: "rpg-1",
  name: "Goblin",
  image: "https://cdn.example.com/goblin.png",
  raceKey: null,
  classKey: null,
  characterType: "npc",
  visibility: "public",
  maxCarryWeight: null,
  progressionMode: "xp_level",
  progressionLabel: "Level 1",
  progressionRequired: 0,
  progressionCurrent: 0,
  createdByUserId: "user-1",
  life: 10,
  defense: 2,
  mana: 0,
  exhaustion: 0,
  sanity: 10,
  statuses: { life: 10 },
  currentStatuses: { life: 8 },
  attributes: {},
  skills: {},
  identity: {},
  characteristics: {},
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z")
}

function createDependencies() {
  const repository: CharacterUpdateRepository = {
    findById: vi.fn().mockResolvedValue(character),
    update: vi.fn().mockResolvedValue(true)
  }
  const rpgAccessRepository: RpgAccessRepository = {
    getRpgAccessRow: vi.fn().mockResolvedValue({
      ownerId: "user-1",
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }]
    }),
    getMembership: vi.fn().mockResolvedValue(null)
  }
  const templatesRepository: RpgTemplatesRepository = {
    getAttributeTemplates: vi.fn().mockResolvedValue([]),
    getStatusTemplates: vi.fn().mockResolvedValue([]),
    getSkillTemplates: vi.fn().mockResolvedValue([]),
    getIdentityTemplates: vi.fn().mockResolvedValue([]),
    getCharacteristicTemplates: vi.fn().mockResolvedValue([]),
    getRaceTemplates: vi.fn().mockResolvedValue([]),
    getClassTemplates: vi.fn().mockResolvedValue([])
  }
  const imageCleanupService: CharacterImageCleanupService = {
    cleanup: vi.fn().mockResolvedValue(undefined)
  }

  return {
    repository,
    rpgAccessRepository,
    templatesRepository,
    imageCleanupService
  }
}

describe("updateCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builds and persists an update command in the application layer", async () => {
    const deps = createDependencies()

    await updateCharacter(deps, {
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "user-1",
      payload: {
        name: "Goblin Rei",
        visibility: "private",
        characteristics: { title: "Chefe" }
      }
    })

    expect(deps.repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        rpgId: "rpg-1",
        characterId: "char-1",
        name: "Goblin Rei",
        visibility: "private",
        characteristics: { title: "Chefe" },
        hasImage: false,
        hasRaceKey: false,
        hasClassKey: false
      })
    )
  })

  it("keeps race and class unchanged for npc updates", async () => {
    const deps = createDependencies()

    await updateCharacter(deps, {
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "user-1",
      payload: { raceKey: "orc", classKey: "warrior" }
    })

    expect(deps.templatesRepository.getRaceTemplates).not.toHaveBeenCalled()
    expect(deps.templatesRepository.getClassTemplates).not.toHaveBeenCalled()
    expect(deps.repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        hasRaceKey: false,
        hasClassKey: false
      })
    )
  })

  it("prevents a player owner from changing race without master permission", async () => {
    const deps = createDependencies()
    vi.mocked(deps.repository.findById).mockResolvedValue({
      ...character,
      characterType: "player"
    })
    vi.mocked(deps.rpgAccessRepository.getRpgAccessRow).mockResolvedValue({
      ownerId: "master-1",
      useRaceBonuses: false,
      useClassBonuses: false,
      useInventoryWeightLimit: false,
      allowMultiplePlayerCharacters: false,
      progressionMode: "xp_level",
      progressionTiers: [{ label: "Level 1", required: 0 }]
    })
    vi.mocked(deps.rpgAccessRepository.getMembership).mockResolvedValue({
      status: "accepted",
      role: "player"
    })

    await expect(
      updateCharacter(deps, {
        rpgId: "rpg-1",
        characterId: "char-1",
        userId: "user-1",
        payload: { raceKey: "human" }
      })
    ).rejects.toMatchObject({
      status: 403,
      message:
        "Somente mestre ou moderador podem editar raca e classe de personagens."
    })
  })

  it("cleans up a replaced image after persistence succeeds", async () => {
    const deps = createDependencies()

    await updateCharacter(deps, {
      rpgId: "rpg-1",
      characterId: "char-1",
      userId: "user-1",
      payload: { image: "https://cdn.example.com/new.png" }
    })

    expect(deps.imageCleanupService.cleanup).toHaveBeenCalledWith({
      rpgOwnerId: "user-1",
      characterCreatedByUserId: "user-1",
      previousImage: "https://cdn.example.com/goblin.png",
      nextImage: "https://cdn.example.com/new.png"
    })
  })
})
