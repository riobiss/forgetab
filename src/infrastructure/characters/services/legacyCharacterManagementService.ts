import type { CharacterManagementService } from "@/application/characters/ports/CharacterManagementService"
import type { UpdateCharacterPayload } from "@/application/characters/use-cases/updateCharacter"
import { deleteCharacter as legacyDeleteCharacter } from "@/lib/server/characters/deleteCharacter"
import { updateCharacter as legacyUpdateCharacter } from "@/lib/server/characters/updateCharacter"
import { AppError } from "@/shared/errors/AppError"

export const legacyCharacterManagementService: CharacterManagementService = {
  async updateCharacter(params: {
    rpgId: string
    characterId: string
    userId: string
    payload: UpdateCharacterPayload
  }) {
    try {
      await legacyUpdateCharacter(params)
    } catch (error) {
      if (error instanceof Error && "status" in error && typeof error.status === "number") {
        throw new AppError(error.message, error.status)
      }
      throw error
    }
  },

  async deleteCharacter(params: { rpgId: string; characterId: string; userId: string }) {
    try {
      await legacyDeleteCharacter(params)
    } catch (error) {
      if (error instanceof Error && "status" in error && typeof error.status === "number") {
        throw new AppError(error.message, error.status)
      }
      throw error
    }
  },
}
