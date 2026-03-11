import { describe, expect, it, vi } from "vitest"
import type { CharacterProgressionPermissionService } from "@/application/characterProgression/ports/CharacterProgressionPermissionService"
import type { CharacterProgressionRepository } from "@/application/characterProgression/ports/CharacterProgressionRepository"
import {
  grantCharacterPointsUseCase,
  grantCharacterXpUseCase,
} from "@/application/characterProgression/use-cases/characterProgression"

function createRepositoryMock(): CharacterProgressionRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: "char-1",
      rpgId: "rpg-1",
      characterType: "player",
      progressionMode: "xp_level",
      progressionTiers: [
        { label: "Level 1", required: 0 },
        { label: "Level 2", required: 100 },
      ],
      progressionCurrent: 95,
    }),
    updateSkillPoints: vi.fn().mockResolvedValue({ skillPoints: 11 }),
    updateProgression: vi.fn().mockResolvedValue({
      progressionCurrent: 105,
      progressionLabel: "Level 2",
      progressionRequired: 100,
    }),
  }
}

function createPermissionServiceMock(): CharacterProgressionPermissionService {
  return {
    canManageRpg: vi.fn().mockResolvedValue(true),
  }
}

describe("characterProgression use-cases", () => {
  it("grantCharacterPointsUseCase delega update de pontos", async () => {
    const repository = createRepositoryMock()
    const permissionService = createPermissionServiceMock()

    const result = await grantCharacterPointsUseCase(
      { repository, permissionService },
      { characterId: "char-1", userId: "user-1", amount: 3 },
    )

    expect(repository.updateSkillPoints).toHaveBeenCalledWith("char-1", 3)
    expect(result).toEqual({ success: true, remainingPoints: 11 })
  })

  it("grantCharacterXpUseCase resolve tier e atualiza progressao", async () => {
    const repository = createRepositoryMock()
    const permissionService = createPermissionServiceMock()

    const result = await grantCharacterXpUseCase(
      { repository, permissionService },
      { characterId: "char-1", userId: "user-1", amount: 10 },
    )

    expect(repository.updateProgression).toHaveBeenCalledWith({
      characterId: "char-1",
      progressionCurrent: 105,
      progressionLabel: "Level 2",
      progressionRequired: 100,
    })
    expect(result).toEqual({
      success: true,
      progressionCurrent: 105,
      progressionLabel: "Level 2",
      progressionRequired: 100,
    })
  })
})
