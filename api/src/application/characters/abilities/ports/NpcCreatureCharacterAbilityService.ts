import type { PurchasedAbilityViewDto } from "@/application/characters/abilities/types"

export interface NpcCreatureCharacterAbilityService {
  addAbility(
    rpgId: string,
    characterId: string,
    userId: string,
    params: { skillId: string; level: number },
  ): Promise<{ success: true; ability: PurchasedAbilityViewDto }>
  removeAbility(
    rpgId: string,
    characterId: string,
    userId: string,
    params: { skillId: string; level: number },
  ): Promise<{ success: true }>
}
