import type { CharacterManagementService } from "@/features/world/character/application/ports/CharacterManagementService"
import { deleteCharacterWithManagement } from "@/features/world/character/infrastructure/services/characterManagementDelete"

export const characterManagementService: CharacterManagementService = {
  deleteCharacter: deleteCharacterWithManagement
}
