import type { PurchasedAbilityViewDto } from "@/features/world/character/application/abilities/types"

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
