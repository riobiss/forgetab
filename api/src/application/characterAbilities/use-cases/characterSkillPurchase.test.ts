import { describe, expect, it, vi } from "vitest"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase,
} from "@/application/characterAbilities/use-cases/characterSkillPurchase"
import { AppError } from "@/shared/errors/AppError"

describe("characterSkillPurchase use-cases", () => {
  it("valida payload de compra", async () => {
    const deps = {
      service: {
        buySkill: vi.fn(),
        removeSkill: vi.fn(),
      },
    }

    await expect(
      buyCharacterSkillUseCase(deps, {
        characterId: "char-1",
        userId: "user-1",
        payload: { skillId: "", level: 0 },
      }),
    ).rejects.toBeInstanceOf(AppError)
  })

  it("delega compra ao service", async () => {
    const deps = {
      service: {
        buySkill: vi.fn().mockResolvedValue({
          status: 200,
          success: true,
          remainingPoints: 3,
        }),
        removeSkill: vi.fn(),
      },
    }

    const result = await buyCharacterSkillUseCase(deps, {
      characterId: "char-1",
      userId: "user-1",
      payload: { skillId: "skill-1", level: 1 },
    })

    expect(deps.service.buySkill).toHaveBeenCalledWith("char-1", "user-1", {
      skillId: "skill-1",
      level: 1,
    })
    expect(result.remainingPoints).toBe(3)
  })

  it("delega remocao ao service", async () => {
    const deps = {
      service: {
        buySkill: vi.fn(),
        removeSkill: vi.fn().mockResolvedValue({
          status: 200,
          success: true,
          remainingPoints: 5,
        }),
      },
    }

    const result = await removeCharacterSkillUseCase(deps, {
      characterId: "char-1",
      userId: "user-1",
      payload: { skillId: "skill-1", level: 2 },
    })

    expect(deps.service.removeSkill).toHaveBeenCalledWith("char-1", "user-1", {
      skillId: "skill-1",
      level: 2,
    })
    expect(result.remainingPoints).toBe(5)
  })
})
