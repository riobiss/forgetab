import { describe, expect, it } from "vitest"
import type { PurchasedAbilityViewDto } from "./types"
import {
  collectAbilityTags,
  filterPurchasedAbilities,
  mergeCatalogValues
} from "./abilityFilters"

const ability = {
  skillId: "skill-1",
  levelNumber: 1,
  skillName: "Proteção Arcana",
  levelName: "Escudo Superior",
  skillDescription: "Defesa mágica",
  levelDescription: null,
  notesList: ["Reação"],
  skillCategory: "arcana",
  skillType: "defense",
  skillActionType: "reaction",
  skillTags: ["magic", "defense"],
  summary: null,
  damage: null,
  range: null,
  cooldown: null,
  duration: null,
  castTime: null,
  resourceCost: null,
  prerequisite: null,
  allowedClasses: ["Mago"],
  allowedRaces: [],
  levelRequired: 1,
  pointsCost: 1,
  costCustom: null,
  customFields: []
} satisfies PurchasedAbilityViewDto

describe("abilityFilters", () => {
  it("combina busca robusta e filtros estruturados", () => {
    expect(
      filterPurchasedAbilities([ability], {
        search: "magica escudo",
        categories: ["arcana"],
        types: ["defense"],
        actionTypes: ["reaction"],
        tags: ["magic"]
      })
    ).toEqual([ability])
  })

  it("rejeita quando algum filtro selecionado nao corresponde", () => {
    expect(
      filterPurchasedAbilities([ability], {
        search: "",
        categories: ["tecnicas"],
        types: [],
        actionTypes: [],
        tags: []
      })
    ).toEqual([])
  })

  it("deduplica tags e preserva a ordem do catalogo", () => {
    expect(collectAbilityTags([ability, ability])).toEqual(["magic", "defense"])
    expect(
      mergeCatalogValues(["attack", "defense"], ["custom", "attack"])
    ).toEqual(["attack", "defense", "custom"])
  })
})
