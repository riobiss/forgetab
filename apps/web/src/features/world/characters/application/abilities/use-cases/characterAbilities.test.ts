import { describe, expect, it, vi } from "vitest"
import { removeCharacterAbilityUseCase } from "@/features/world/characters/application/abilities/use-cases/characterAbilities"

describe("character ability client use cases", () => {
  it("delegates ability removal to the configured gateway", async () => {
    const gateway = {
      removeAbility: vi.fn().mockResolvedValue({ success: true })
    }

    const result = await removeCharacterAbilityUseCase(
      { gateway },
      {
        characterId: "char-1",
        skillId: "skill-1",
        level: 2
      }
    )

    expect(gateway.removeAbility).toHaveBeenCalledWith("char-1", {
      skillId: "skill-1",
      level: 2
    })
    expect(result).toEqual({ success: true })
  })
})
