import type { CharacterManagementService } from "@/features/world/character/application/ports/CharacterManagementService"
import { deleteCharacterWithLegacyManagement } from "@/features/world/character/infrastructure/services/characterManagementDelete"
import { updateCharacterWithLegacyManagement } from "@/features/world/character/infrastructure/services/characterManagementUpdate"

export const characterManagementService: CharacterManagementService = {
  updateCharacter: updateCharacterWithLegacyManagement,
  deleteCharacter: deleteCharacterWithLegacyManagement,
}
