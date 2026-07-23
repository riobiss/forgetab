import type { UpdateCharacterPayload } from "@/features/world/character/application/use-cases/updateCharacter"

export interface CharacterManagementService {
  updateCharacter(params: {
    rpgId: string
    characterId: string
    userId: string
    payload: UpdateCharacterPayload
  }): Promise<void>
  deleteCharacter(params: {
    rpgId: string
    characterId: string
    userId: string
  }): Promise<void>
}
