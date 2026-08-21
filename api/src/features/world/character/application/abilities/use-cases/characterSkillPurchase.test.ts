import { describe, expect, it, vi } from "vitest"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase
} from "@/features/world/character/application/abilities/use-cases/characterSkillPurchase"
import { AppError } from "@/features/shared/application/errors/AppError"

describe("characterSkillPurchase use-cases", () => {
  it("valida payload de compra", async () => {
    const deps = {
      repository: { mutate: vi.fn() }
    }

    await expect(
      buyCharacterSkillUseCase(deps, {
        characterId: "char-1",
        userId: "user-1",
        payload: { skillId: "", level: 0 }
      })
    ).rejects.toBeInstanceOf(AppError)
  })

  it("compra habilidade permitida e debita os pontos", async () => {
    const deps = {
      repository: {
        mutate: vi.fn(async (_params, decide) => {
          const mutation = decide({
            character: {
              id: "char-1",
              rpgId: "rpg-1",
              ownerId: "owner-1",
              createdByUserId: "user-1",
              raceKey: "elf",
              classKey: "mage",
              characterType: "player" as const,
              skillPoints: 5,
              abilities: [],
              costsEnabled: true
            },
            skillLevelExists: true,
            skillLevelCost: { points: 2 },
            skillExists: true,
            skillHasRestrictions: true,
            skillMatchesCharacterRestriction: true
          })
          expect(mutation.skillPointsDelta).toBe(-2)
          expect(mutation.abilities).toEqual([{ skillId: "skill-1", level: 1 }])
          return { remainingPoints: 3 }
        })
      }
    }

    const result = await buyCharacterSkillUseCase(deps, {
      characterId: "char-1",
      userId: "user-1",
      payload: { skillId: "skill-1", level: 1 }
    })

    expect(deps.repository.mutate).toHaveBeenCalledWith(
      {
        characterId: "char-1",
        skillId: "skill-1",
        level: 1
      },
      expect.any(Function)
    )
    expect(result.remainingPoints).toBe(3)
  })

  it("permite comprar habilidade vinculada apenas a raca", async () => {
    const deps = {
      repository: {
        mutate: vi.fn(async (_params, decide) => {
          const mutation = decide({
            character: {
              id: "char-1",
              rpgId: "rpg-1",
              ownerId: "owner-1",
              createdByUserId: "user-1",
              raceKey: "elf",
              classKey: "warrior",
              characterType: "player" as const,
              skillPoints: 5,
              abilities: [],
              costsEnabled: true
            },
            skillLevelExists: true,
            skillLevelCost: { points: 1 },
            skillExists: true,
            skillHasRestrictions: true,
            skillMatchesCharacterRestriction: true
          })
          expect(mutation.skillPointsDelta).toBe(-1)
          return { remainingPoints: 4 }
        })
      }
    }

    const result = await buyCharacterSkillUseCase(deps, {
      characterId: "char-1",
      userId: "user-1",
      payload: { skillId: "skill-1", level: 1 }
    })

    expect(result.remainingPoints).toBe(4)
  })

  it("permite comprar habilidade sem restricoes de classe ou raca", async () => {
    const deps = {
      repository: {
        mutate: vi.fn(async (_params, decide) => {
          const mutation = decide({
            character: {
              id: "char-1",
              rpgId: "rpg-1",
              ownerId: "owner-1",
              createdByUserId: "user-1",
              raceKey: null,
              classKey: null,
              characterType: "player" as const,
              skillPoints: 5,
              abilities: [],
              costsEnabled: true
            },
            skillLevelExists: true,
            skillLevelCost: { points: 2 },
            skillExists: true,
            skillHasRestrictions: false,
            skillMatchesCharacterRestriction: false
          })
          expect(mutation.skillPointsDelta).toBe(-2)
          return { remainingPoints: 3 }
        })
      }
    }

    const result = await buyCharacterSkillUseCase(deps, {
      characterId: "char-1",
      userId: "user-1",
      payload: { skillId: "skill-1", level: 1 }
    })

    expect(result.remainingPoints).toBe(3)
  })

  it("bloqueia habilidade quando nenhuma restricao corresponde", async () => {
    const deps = {
      repository: {
        mutate: vi.fn(async (_params, decide) => {
          decide({
            character: {
              id: "char-1",
              rpgId: "rpg-1",
              ownerId: "owner-1",
              createdByUserId: "user-1",
              raceKey: "human",
              classKey: "warrior",
              characterType: "player" as const,
              skillPoints: 5,
              abilities: [],
              costsEnabled: true
            },
            skillLevelExists: true,
            skillLevelCost: { points: 1 },
            skillExists: true,
            skillHasRestrictions: true,
            skillMatchesCharacterRestriction: false
          })
          return { remainingPoints: 5 }
        })
      }
    }

    await expect(
      buyCharacterSkillUseCase(deps, {
        characterId: "char-1",
        userId: "user-1",
        payload: { skillId: "skill-1", level: 1 }
      })
    ).rejects.toMatchObject({
      status: 400,
      message:
        "Nao e permitido comprar esta habilidade para a classe ou raca do personagem."
    })
  })

  it("remove habilidade e devolve os pontos", async () => {
    const deps = {
      repository: {
        mutate: vi.fn(async (_params, decide) => {
          const mutation = decide({
            character: {
              id: "char-1",
              rpgId: "rpg-1",
              ownerId: "owner-1",
              createdByUserId: "user-1",
              raceKey: "elf",
              classKey: "mage",
              characterType: "player" as const,
              skillPoints: 3,
              abilities: [{ skillId: "skill-1", level: 2 }],
              costsEnabled: true
            },
            skillLevelExists: true,
            skillLevelCost: { points: 2 },
            skillExists: true,
            skillHasRestrictions: true,
            skillMatchesCharacterRestriction: true
          })
          expect(mutation.skillPointsDelta).toBe(2)
          expect(mutation.abilities).toEqual([])
          return { remainingPoints: 5 }
        })
      }
    }

    const result = await removeCharacterSkillUseCase(deps, {
      characterId: "char-1",
      userId: "user-1",
      payload: { skillId: "skill-1", level: 2 }
    })

    expect(deps.repository.mutate).toHaveBeenCalledWith(
      {
        characterId: "char-1",
        skillId: "skill-1",
        level: 2
      },
      expect.any(Function)
    )
    expect(result.remainingPoints).toBe(5)
  })
})
