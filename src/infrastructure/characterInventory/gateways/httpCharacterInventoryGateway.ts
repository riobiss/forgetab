import type { CharacterInventoryGateway } from "@/application/characterInventory/contracts/CharacterInventoryGateway"
import type { CharacterInventoryDataDto, CharacterInventoryItemDto } from "@/application/characterInventory/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpCharacterInventoryGateway: CharacterInventoryGateway = {
  async fetchInventory(rpgId: string, characterId: string): Promise<CharacterInventoryDataDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/inventory`)
    const payload = await parseJson<{
      inventory?: CharacterInventoryItemDto[]
      useInventoryWeightLimit?: boolean
      maxCarryWeight?: number | null
    }>(response)

    return {
      inventory: payload.inventory ?? [],
      useInventoryWeightLimit: Boolean(payload.useInventoryWeightLimit),
      maxCarryWeight: payload.maxCarryWeight ?? null,
    }
  },

  async removeInventoryItem(
    rpgId: string,
    characterId: string,
    params: { inventoryItemId: string; quantity: number },
  ): Promise<{ inventoryItemId: string; remainingQuantity: number }> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}/inventory`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    })
    const payload = await parseJson<{
      inventoryItemId?: string
      remainingQuantity?: number
    }>(response)

    return {
      inventoryItemId: payload.inventoryItemId ?? params.inventoryItemId,
      remainingQuantity: payload.remainingQuantity ?? 0,
    }
  },
}
