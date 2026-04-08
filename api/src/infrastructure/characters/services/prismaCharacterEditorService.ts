import type { CharacterEditorService } from "@/application/characters/ports/CharacterEditorService"
import { resolveCharacterManagementPermission } from "@/infrastructure/characters/services/characterManagementPermission"

export const prismaCharacterEditorService: CharacterEditorService = {
  async loadEditableCharacter({ rpgId, characterId, userId }) {
    try {
      const permission = await resolveCharacterManagementPermission({ rpgId, characterId, userId })
      return {
        status: "ok" as const,
        character: permission.character,
      }
    } catch (error) {
      if (error && typeof error === "object" && "status" in error) {
        const appError = error as { status?: number; message?: string }
        if (appError.status === 404) {
          return { status: "not_found" as const }
        }
        if (appError.status === 403) {
          return {
            status: "forbidden" as const,
            message: appError.message ?? "Sem permissao para editar este personagem.",
          }
        }
      }
      throw error
    }
  },
}
