import { describe, expect, it } from "vitest"
import {
  buildSkillSlug,
  createRpgScope,
  skillLevelCreateSchema,
  skillMetaCreateSchema,
} from "./skillBuilder"

describe("skillMetaCreateSchema", () => {
  it("aplica defaults de level1 e listas", () => {
    const result = skillMetaCreateSchema.parse({
      name: "Bola de Fogo",
    })

    expect(result.classIds).toEqual([])
    expect(result.raceIds).toEqual([])
    expect(result.level1.levelRequired).toBe(1)
    expect(result.level1.summary).toBeNull()
  })

  it("normaliza campos opcionais e deduplica ids", () => {
    const result = skillMetaCreateSchema.parse({
      name: "Corte Rapido",
      category: "",
      type: "",
      description: "   ",
      classIds: [" class-a ", "class-a", "class-b"],
      raceIds: [" race-1 ", "race-1"],
    })

    expect(result.category).toBeNull()
    expect(result.type).toBeNull()
    expect(result.description).toBeNull()
    expect(result.classIds).toEqual(["class-a", "class-b"])
    expect(result.raceIds).toEqual(["race-1"])
  })
})

describe("skillLevelCreateSchema", () => {
  it("normaliza numeros opcionais para null/floor", () => {
    const result = skillLevelCreateSchema.parse({
      cost: {
        points: 2,
      },
      requirement: {
        levelRequired: 3.9,
      },
    })

    expect(result.cost?.points).toBe(2)
    expect(result.requirement?.levelRequired).toBe(3)
  })
})

describe("skillBuilder helpers", () => {
  it("gera slug a partir do nome", () => {
    expect(buildSkillSlug("  Chuva de Gelo  ")).toBe("chuva-de-gelo")
  })

  it("gera escopo global quando rpgId vazio", () => {
    expect(createRpgScope("   ")).toBe("global")
    expect(createRpgScope(" rpg-1 ")).toBe("rpg-1")
  })
})
