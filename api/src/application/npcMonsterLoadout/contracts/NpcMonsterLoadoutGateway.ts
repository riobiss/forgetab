import type { PurchasedAbilityViewDto } from "@/application/characters/abilities/types"
import type { CharacterInventoryItemDto } from "@/application/characters/inventory/types"
import type {
  NpcMonsterAbilitiesDataDto,
  NpcMonsterInventoryDataDto,
  NpcMonsterLoadoutItemOptionDto,
  NpcMonsterLoadoutSkillOptionDto,
} from "@/application/npcMonsterLoadout/types"

export interface NpcMonsterLoadoutGateway {
  fetchInventory(rpgId: string, characterId: string): Promise<NpcMonsterInventoryDataDto>
  listAvailableItems(rpgId: string): Promise<NpcMonsterLoadoutItemOptionDto[]>
  addInventoryItem(
    rpgId: string,
    characterId: string,
    params: { baseItemId: string; quantity?: number },
  ): Promise<{ success: boolean }>
  removeInventoryItem(
    rpgId: string,
    characterId: string,
    params: { inventoryItemId: string; quantity: number },
  ): Promise<{ inventoryItemId: string; remainingQuantity: number }>
  fetchAbilities(rpgId: string, characterId: string): Promise<NpcMonsterAbilitiesDataDto>
  listAvailableSkills(rpgId: string): Promise<NpcMonsterLoadoutSkillOptionDto[]>
  addAbility(
    rpgId: string,
    characterId: string,
    params: { skillId: string; level?: number },
  ): Promise<{ success: boolean; ability?: PurchasedAbilityViewDto }>
  removeAbility(
    rpgId: string,
    characterId: string,
    params: { skillId: string; level: number },
  ): Promise<{ success: boolean }>
}
