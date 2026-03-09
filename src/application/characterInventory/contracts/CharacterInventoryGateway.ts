import type { CharacterInventoryDataDto } from "@/application/characterInventory/types"

export interface CharacterInventoryGateway {
  fetchInventory(rpgId: string, characterId: string): Promise<CharacterInventoryDataDto>
  removeInventoryItem(
    rpgId: string,
    characterId: string,
    params: { inventoryItemId: string; quantity: number },
  ): Promise<{ inventoryItemId: string; remainingQuantity: number }>
}
