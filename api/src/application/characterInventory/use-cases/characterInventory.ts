import type { CharacterInventoryDependencies } from "@/application/characterInventory/contracts/CharacterInventoryDependencies"

type Dependencies = CharacterInventoryDependencies

export async function loadCharacterInventoryUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.fetchInventory(params.rpgId, params.characterId)
}

export async function removeCharacterInventoryItemUseCase(
  deps: Dependencies,
  params: {
    rpgId: string
    characterId: string
    inventoryItemId: string
    quantity: number
  },
) {
  return deps.gateway.removeInventoryItem(params.rpgId, params.characterId, {
    inventoryItemId: params.inventoryItemId,
    quantity: params.quantity,
  })
}
