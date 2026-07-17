export interface CharacterSkillPurchaseService {
  buySkill(
    characterId: string,
    userId: string,
    params: { skillId: string; level: number },
  ): Promise<{ status: number; success: true; remainingPoints: number }>
  removeSkill(
    characterId: string,
    userId: string,
    params: { skillId: string; level: number },
  ): Promise<{ status: number; success: true; remainingPoints: number }>
}
