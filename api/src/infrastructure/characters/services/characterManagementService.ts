import type { CharacterManagementService } from "@/application/characters/ports/CharacterManagementService"
import { deleteCharacterWithLegacyManagement } from "@/infrastructure/characters/services/characterManagementDelete"
import { updateCharacterWithLegacyManagement } from "@/infrastructure/characters/services/characterManagementUpdate"

export const characterManagementService: CharacterManagementService = {
  updateCharacter: updateCharacterWithLegacyManagement,
  deleteCharacter: deleteCharacterWithLegacyManagement,
}
