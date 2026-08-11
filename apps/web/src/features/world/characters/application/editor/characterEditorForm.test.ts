import { describe, expect, it } from "vitest"
import type { CharacterEditorBootstrapDto } from "@forgetab/world-contracts/character-editor"
import {
  buildCharacterEditorFormSnapshot,
  normalizeNumericValues
} from "./characterEditorForm"

const bootstrap: CharacterEditorBootstrapDto = {
  attributes: [{ key: "strength", label: "Forca", position: 0 }],
  statuses: [{ key: "life", label: "Vida", position: 0 }],
  skills: [{ key: "arcana", label: "Arcana", position: 0 }],
  characters: [
    {
      id: "character-1",
      name: "Lia",
      characterType: "player",
      visibility: "public",
      attributes: { strength: 8 },
      statuses: { life: 20 },
      skills: { arcana: 3 },
      identity: {},
      characteristics: { scar: "rosto" }
    }
  ],
  rpg: {
    useClassRaceBonuses: true,
    useRaceBonuses: false,
    progressionMode: "rank",
    progressionTiers: [{ label: "Novato", required: 0 }]
  },
  races: [],
  classes: [],
  identityFields: [
    { key: "name", label: "Nome", required: true, position: 0 }
  ],
  characteristicFields: [
    { key: "scar", label: "Cicatriz", required: false, position: 0 }
  ],
  assignablePlayers: []
}

describe("buildCharacterEditorFormSnapshot", () => {
  it("normalizes legacy settings and an existing character", () => {
    const snapshot = buildCharacterEditorFormSnapshot(
      bootstrap,
      "character-1"
    )

    expect(snapshot).toMatchObject({
      useRaceBonuses: false,
      useClassBonuses: true,
      progressionMode: "rank",
      attributeValues: { strength: 8 },
      statusValues: { life: 20 },
      skillValues: { arcana: 3 },
      identityValues: { name: "Lia" },
      characteristicsValues: { scar: "rosto" }
    })
  })

  it("keeps numeric fields empty when creating a character", () => {
    expect(buildCharacterEditorFormSnapshot(bootstrap)).toMatchObject({
      attributeValues: { strength: "" },
      statusValues: { life: "" },
      skillValues: { arcana: "" }
    })
  })
})

describe("normalizeNumericValues", () => {
  it("converts empty inputs to zero", () => {
    expect(normalizeNumericValues({ life: "", mana: 4 })).toEqual({
      life: 0,
      mana: 4
    })
  })
})
