import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type {
  NpcCreatureAbilitiesDataDto,
  NpcCreatureInventoryDataDto,
  NpcCreatureLoadoutItemOptionDto,
  NpcCreatureLoadoutSkillOptionDto,
} from "@/application/npcCreatureLoadout/types"

export interface NpcCreatureLoadoutGateway {
  fetchInventory(rpgId: string, characterId: string): Promise<NpcCreatureInventoryDataDto>
  listAvailableItems(rpgId: string): Promise<NpcCreatureLoadoutItemOptionDto[]>
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
  fetchAbilities(rpgId: string, characterId: string): Promise<NpcCreatureAbilitiesDataDto>
  listAvailableSkills(rpgId: string): Promise<NpcCreatureLoadoutSkillOptionDto[]>
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
