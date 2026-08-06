import type { CharacterInventoryDataDto } from "@forgetab/world-contracts/character-inventory"

export interface CharacterInventoryGateway {
  fetchInventory(
    rpgId: string,
    characterId: string
  ): Promise<CharacterInventoryDataDto>
  removeInventoryItem(
    rpgId: string,
    characterId: string,
    params: { inventoryItemId: string; quantity: number }
  ): Promise<{ inventoryItemId: string; remainingQuantity: number }>
}
