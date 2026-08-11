import { describe, expect, it } from "vitest"
import {
  filterCatalogAbilitiesByCharacterLevel,
  resolveCatalogCharacterLevel
} from "@/features/world/catalog/application/rules/entityCatalogAbilityVisibility"
import type { EntityCatalogAbilityView } from "@/features/world/catalog/application/types"

describe("entityCatalogAbilityVisibility", () => {
  it("usa o maior nivel entre personagens compativeis", () => {
    expect(
      resolveCatalogCharacterLevel([
        {
          progressionMode: "rank",
          progressionTiers: [
            { label: "Novato", required: 0 },
            { label: "Veterano", required: 100 },
            { label: "Elite", required: 300 }
          ],
          progressionCurrent: 120
        },
        {
          progressionMode: "rank",
          progressionTiers: [
            { label: "Novato", required: 0 },
            { label: "Veterano", required: 100 },
            { label: "Elite", required: 300 }
          ],
          progressionCurrent: 400
        }
      ])
    ).toBe(3)
  })

  it("usa nivel 1 quando nao existe personagem compativel", () => {
    expect(resolveCatalogCharacterLevel([])).toBe(1)
  })

  it("remove niveis acima do requisito e habilidades que ficam vazias", () => {
    const abilities = [ability("skill-1", [1, 2, 4]), ability("skill-2", [4])]

    expect(filterCatalogAbilitiesByCharacterLevel(abilities, 2)).toEqual([
      ability("skill-1", [1, 2])
    ])
    expect(abilities[0]?.levels).toHaveLength(3)
  })
})

function ability(
  skillId: string,
  requiredLevels: number[]
): EntityCatalogAbilityView {
  return {
    skillId,
    skillName: skillId,
    skillDescription: null,
    skillCategory: null,
    skillType: null,
    skillActionType: null,
    skillTags: [],
    levels: requiredLevels.map((levelRequired, index) => ({
      levelNumber: index + 1,
      levelRequired,
      levelCategory: null,
      levelType: null,
      levelActionType: null,
      levelName: null,
      levelDescription: null,
      notesList: [],
      customFields: [],
      description: null,
      summary: null,
      damage: null,
      range: null,
      cooldown: null,
      duration: null,
      castTime: null,
      resourceCost: null,
      pointsCost: null,
      costCustom: null
    }))
  }
}
