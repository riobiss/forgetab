export interface CharacterManagementService {
  deleteCharacter(params: {
    rpgId: string
    characterId: string
    userId: string
  }): Promise<void>
}
