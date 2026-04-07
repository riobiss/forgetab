import type { CharacterEditorService } from "@/application/characters/ports/CharacterEditorService"
import { getCharacterEditorSnapshot } from "@/lib/server/characters/getCharacterEditorSnapshot"
import { canManageCharacter } from "@/lib/server/characters/manage/permissions"

export const legacyCharacterEditorService: CharacterEditorService = {
  async loadEditableCharacter({ rpgId, characterId, userId }) {
    const permission = await canManageCharacter(rpgId, characterId, userId)

    if (!permission.ok) {
      return permission.status === 404
        ? { status: "not_found" as const }
        : {
            status: "forbidden" as const,
            message: permission.message,
          }
    }

    const character = await getCharacterEditorSnapshot(rpgId, characterId)
    if (!character) {
      return { status: "not_found" as const }
    }

    return {
      status: "ok" as const,
      character,
    }
  },
}
