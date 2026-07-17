import type { PurchasedAbilityViewDto } from "@/features/world/characters/application/abilities/types"

export interface NpcMonsterCharacterAbilityService {
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
