import { describe, expect, it } from "vitest"
import {
  addAbility,
  ownsAbility,
  parseCharacterAbilities,
  parseCostPoints,
  removeAbility
} from "@/features/world/character/application/abilities/rules/characterAbilityRules"

describe("characterAbilityRules", () => {
  it("normaliza habilidades persistidas e ignora entradas invalidas", () => {
    expect(
      parseCharacterAbilities([
        { skillId: " fire ", level: 1 },
        { skillId: "", level: 2 },
        { skillId: "ice", level: 0 },
        null
      ])
    ).toEqual([{ skillId: "fire", level: 1 }])
  })

  it("normaliza somente custos validos", () => {
    expect(parseCostPoints({ points: 2.8 })).toBe(2)
    expect(parseCostPoints({ points: -1 })).toBeNull()
    expect(parseCostPoints(null)).toBeNull()
  })

  it("substitui o level da mesma habilidade ao adicionar", () => {
    const result = addAbility(
      [
        { skillId: "fire", level: 1 },
        { skillId: "ice", level: 1 }
      ],
      "fire",
      2
    )

    expect(result).toEqual([
      { skillId: "ice", level: 1 },
      { skillId: "fire", level: 2 }
    ])
    expect(ownsAbility(result, "fire", 2)).toBe(true)
  })

  it("remove somente a habilidade e o level informados", () => {
    expect(
      removeAbility(
        [
          { skillId: "fire", level: 1 },
          { skillId: "ice", level: 1 }
        ],
        "fire",
        1
      )
    ).toEqual([{ skillId: "ice", level: 1 }])
  })
})
