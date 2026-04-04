export interface CharacterAbilitiesGateway {
  removeAbility(
    characterId: string,
    params: { skillId: string; level: number },
  ): Promise<{ success: boolean }>
}
