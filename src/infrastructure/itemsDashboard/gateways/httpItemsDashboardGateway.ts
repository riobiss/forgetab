import type { ItemsDashboardGateway } from "@/application/itemsDashboard/contracts/ItemsDashboardGateway"
import type {
  BaseItemDto,
  CharacterSummaryDto,
  GiveItemPayloadDto,
} from "@/application/itemsDashboard/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpItemsDashboardGateway: ItemsDashboardGateway = {
  async fetchItems(rpgId: string): Promise<BaseItemDto[]> {
    const response = await fetch(`/api/rpg/${rpgId}/items`)
    const payload = await parseJson<{ items?: BaseItemDto[] }>(response)
    return payload.items ?? []
  },

  async fetchCharacters(rpgId: string): Promise<CharacterSummaryDto[]> {
    const response = await fetch(`/api/rpg/${rpgId}/characters`)
    const payload = await parseJson<{ characters?: CharacterSummaryDto[] }>(response)
    return payload.characters ?? []
  },

  async deleteItem(rpgId: string, itemId: string): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/items/${itemId}`, {
      method: "DELETE",
    })
    await parseJson<{ message?: string }>(response)
  },

  async giveItem(rpgId: string, payload: GiveItemPayloadDto): Promise<{ message: string }> {
    const response = await fetch(`/api/rpg/${rpgId}/items/give`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ message?: string }>(response)
    return { message: result.message ?? "Item entregue com sucesso." }
  },
}
