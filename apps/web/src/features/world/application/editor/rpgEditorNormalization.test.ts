import { describe, expect, it } from "vitest"
import type { RpgEditorDetailDto } from "@/features/world/application/editor/types"
import {
  normalizeProgressionTiersForPersistence,
  normalizeRpgEditorCompatibility
} from "./rpgEditorNormalization"

const baseRpg: RpgEditorDetailDto = {
  id: "rpg-1",
  title: "Teste",
  description: "",
  visibility: "private"
}

describe("normalizeRpgEditorCompatibility", () => {
  it("uses the legacy class/race flag only when the new flags are absent", () => {
    expect(
      normalizeRpgEditorCompatibility({
        ...baseRpg,
        useClassRaceBonuses: true,
        useRaceBonuses: false
      })
    ).toMatchObject({ useRaceBonuses: false, useClassBonuses: true })
  })

  it("reduces the obsolete five-level default without changing custom tiers", () => {
    const legacy = normalizeRpgEditorCompatibility({
      ...baseRpg,
      progressionMode: "xp_level",
      progressionTiers: [
        { label: "Level 1", required: 0 },
        { label: "Level 2", required: 100 },
        { label: "Level 3", required: 250 },
        { label: "Level 4", required: 450 },
        { label: "Level 5", required: 700 }
      ]
    })
    const custom = normalizeRpgEditorCompatibility({
      ...baseRpg,
      progressionMode: "rank",
      progressionTiers: [{ label: "Veterano", required: 42 }]
    })

    expect(legacy.progressionTiers).toHaveLength(2)
    expect(custom.progressionTiers).toEqual([
      { label: "Veterano", required: 42 }
    ])
  })
})

describe("normalizeProgressionTiersForPersistence", () => {
  it("sanitizes labels and numeric requirements before persistence", () => {
    expect(
      normalizeProgressionTiersForPersistence("rank", [
        { label: "  ", required: -2.5 },
        { label: " Mestre ", required: 19.9 }
      ])
    ).toEqual([
      { label: "Etapa", required: 0 },
      { label: "Mestre", required: 19 }
    ])
  })
})
