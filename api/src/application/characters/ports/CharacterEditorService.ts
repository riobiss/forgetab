import type { CharacterRow } from "@/application/characters/types"

export type LoadEditableCharacterResult =
  | {
      status: "ok"
      character: CharacterRow
    }
  | {
      status: "not_found"
    }
  | {
      status: "forbidden"
      message: string
    }

export interface CharacterEditorService {
  loadEditableCharacter(params: {
    rpgId: string
    characterId: string
    userId: string
  }): Promise<LoadEditableCharacterResult>
}
