import { describe, expect, it } from "vitest"
import {
  mapCreateSkillPayload,
  mapUpdateSkillLevelPayload,
  mapUpdateSkillMetaPayload,
  type SkillLevelInput,
  type SkillMetaInput,
} from "@/application/skillsDashboard/mappers/skillPayloadMappers"

function buildMeta(overrides: Partial<SkillMetaInput> = {}): SkillMetaInput {
  return {
    name: "  Bola de Fogo  ",
    description: "  Dano em area  ",
    category: "arcana",
    type: "attack",
    actionType: "action",
    tags: ["arcane", "void"],
    classIds: ["mage"],
    raceIds: ["elf"],
    ...overrides,
  }
}

function buildLevel(overrides: Partial<SkillLevelInput> = {}): SkillLevelInput {
  return {
    levelRequired: " 3 ",
    summary: "  Explode no alvo  ",
    damage: " 2d6 ",
    cooldown: " 1 turno ",
    range: " 12m ",
    duration: " instantaneo ",
    castTime: " 1 acao ",
    resourceCost: " 5 mana ",
    costPoints: " 2 ",
    costCustom: "  1 componente  ",
    prerequisite: "  nível 3  ",
    customFields: [{ id: "cf-1", name: "Elemento", value: "Fogo" }],
    ...overrides,
  }
}

describe("skillPayloadMappers", () => {
  it("mapeia payload de criacao com normalizacao de campos", () => {
    const payload = mapCreateSkillPayload({
      rpgId: "rpg-1",
      meta: buildMeta(),
      level: buildLevel(),
    })

    expect(payload.rpgId).toBe("rpg-1")
    expect(payload.tags).toEqual(["arcane", "void"])
    expect(payload.level1).toMatchObject({
      levelRequired: 3,
      summary: "Explode no alvo",
      stats: {
        name: "Bola de Fogo",
        description: "Dano em area",
        category: "arcana",
        type: "attack",
        actionType: "action",
        damage: "2d6",
      },
      cost: {
        points: 2,
        custom: "1 componente",
      },
      requirement: {
        levelRequired: 3,
        notes: "nível 3",
      },
    })
  })

  it("mapeia meta de update sem campos de level", () => {
    const payload = mapUpdateSkillMetaPayload(buildMeta())

    expect(payload).toEqual({
      tags: ["arcane", "void"],
      classIds: ["mage"],
      raceIds: ["elf"],
    })
  })

  it("usa fallback no levelRequired e transforma vazios em null", () => {
    const payload = mapUpdateSkillLevelPayload({
      meta: buildMeta({
        name: " ",
        description: " ",
        category: "",
        type: "",
        actionType: "",
      }),
      level: buildLevel({
        levelRequired: " ",
        summary: " ",
        damage: " ",
        costPoints: " ",
        costCustom: " ",
        prerequisite: " ",
      }),
      fallbackLevelRequired: 7,
    })

    expect(payload.levelRequired).toBe(7)
    expect(payload.summary).toBeNull()
    expect(payload.stats).toMatchObject({
      name: null,
      description: null,
      category: null,
      type: null,
      actionType: null,
      damage: null,
    })
    expect(payload.cost).toEqual({
      points: null,
      custom: null,
    })
    expect(payload.requirement).toEqual({
      levelRequired: null,
      notes: null,
    })
  })
})
