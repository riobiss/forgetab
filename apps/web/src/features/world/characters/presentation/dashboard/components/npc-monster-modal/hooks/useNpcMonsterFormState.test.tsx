import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { CharacterEditorBootstrapDto } from "@forgetab/world-contracts/character-editor"
import { useNpcMonsterFormState } from "./useNpcMonsterFormState"

const bootstrap: CharacterEditorBootstrapDto = {
  attributes: [{ key: "strength", label: "Forca", position: 0 }],
  statuses: [{ key: "life", label: "Vida", position: 0 }],
  skills: [{ key: "arcana", label: "Arcana", position: 0 }],
  characters: [],
  rpg: null,
  races: [],
  classes: [],
  identityFields: [],
  characteristicFields: [],
  assignablePlayers: []
}

describe("useNpcMonsterFormState", () => {
  it("hydrates and updates numeric fields without leaking setter plumbing", () => {
    const { result } = renderHook(() => useNpcMonsterFormState())

    act(() => {
      result.current.hydrate(bootstrap, {
        id: "npc-1",
        name: "Guarda",
        characterType: "npc",
        visibility: "public",
        attributes: { strength: 4 },
        statuses: { life: 12 },
        skills: { arcana: 1 }
      })
    })

    expect(result.current.name).toBe("Guarda")
    expect(result.current.attributeValues).toEqual({ strength: 4 })
    expect(result.current.statusValues).toEqual({ life: 12 })

    act(() => result.current.updateAttributeValue("strength", "7"))
    expect(result.current.attributeValues).toEqual({ strength: 7 })
  })

  it("adds a custom field and resets the modal draft", () => {
    const { result } = renderHook(() => useNpcMonsterFormState())

    act(() => {
      result.current.setNewFieldKey("Facção")
      result.current.setNewFieldValue("Sentinelas")
    })
    act(() => result.current.addExtraField())

    expect(result.current.extraFields).toEqual([
      expect.objectContaining({ key: "Facção", value: "Sentinelas" })
    ])
    expect(result.current.newFieldKey).toBe("")
    expect(result.current.newFieldValue).toBe("")
    expect(result.current.customFieldModalOpen).toBe(false)
  })
})
