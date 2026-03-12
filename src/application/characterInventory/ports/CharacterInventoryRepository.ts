import type { CharacterInventoryItemDto } from "@/application/characterInventory/types"

export type CharacterInventoryRpgRow = {
  id: string
  ownerId: string
}

export type CharacterInventoryMembershipRow = {
  status: string
  role: string
}

export type CharacterInventoryCharacterRow = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
}

export type CharacterWeightContextRow = {
  useInventoryWeightLimit: boolean
  maxCarryWeight: number | null
}

export type CharacterInventoryStoredItemRow = {
  id: string
  quantity: number
}

export interface CharacterInventoryRepository {
  getRpg(rpgId: string): Promise<CharacterInventoryRpgRow | null>
  getMembership(rpgId: string, userId: string): Promise<CharacterInventoryMembershipRow | null>
  getCharacter(rpgId: string, characterId: string): Promise<CharacterInventoryCharacterRow | null>
  getWeightContext(rpgId: string, characterId: string): Promise<CharacterWeightContextRow>
  listInventory(rpgId: string, characterId: string): Promise<CharacterInventoryItemDto[]>
  getInventoryItem(
    rpgId: string,
    characterId: string,
    inventoryItemId: string,
  ): Promise<CharacterInventoryStoredItemRow | null>
  deleteInventoryItem(rpgId: string, characterId: string, inventoryItemId: string): Promise<void>
  updateInventoryItemQuantity(
    rpgId: string,
    characterId: string,
    inventoryItemId: string,
    quantity: number,
  ): Promise<void>
}
