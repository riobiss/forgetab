import { describe, expect, it } from "vitest"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto
} from "@/features/world/characters/application/editor"
import {
  mergeCharacterSnapshot,
  upsertCharacterSnapshot
} from "./characterSnapshot"

const character = {
  id: "character-1",
  name: "Goblin",
  statuses: { hp: 10 },
  attributes: { strength: 2 },
  skills: {},
  identity: {},
  characteristics: {}
} as unknown as CharacterEditorSummaryDto

describe("character snapshot", () => {
  it("mescla resposta parcial sem perder valores locais", () => {
    const merged = mergeCharacterSnapshot(
      character,
      { name: "Goblin Chefe", statuses: { hp: 12 } },
      { id: "character-1", statuses: {} } as CharacterEditorSummaryDto
    )

    expect(merged).toMatchObject({
      id: "character-1",
      name: "Goblin Chefe",
      statuses: { hp: 12 },
      attributes: { strength: 2 }
    })
  })

  it("insere ou substitui o personagem no bootstrap", () => {
    const bootstrap = {
      characters: []
    } as unknown as CharacterEditorBootstrapDto
    const inserted = upsertCharacterSnapshot(bootstrap, character)
    const updated = upsertCharacterSnapshot(inserted, {
      ...character,
      name: "Goblin Atualizado"
    })

    expect(inserted.characters).toHaveLength(1)
    expect(updated.characters).toHaveLength(1)
    expect(updated.characters[0]?.name).toBe("Goblin Atualizado")
  })
})
