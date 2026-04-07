import type { CharacterEditorService } from "@/application/characters/ports/CharacterEditorService"
import { AppError } from "@/shared/errors/AppError"

export async function getEditableCharacter(
  deps: { editorService: CharacterEditorService },
  params: { rpgId: string; characterId: string; userId: string },
) {
  const result = await deps.editorService.loadEditableCharacter(params)

  if (result.status === "not_found") {
    throw new AppError("Personagem nao encontrado.", 404)
  }

  if (result.status === "forbidden") {
    throw new AppError(result.message, 403)
  }

  return result.character
}
