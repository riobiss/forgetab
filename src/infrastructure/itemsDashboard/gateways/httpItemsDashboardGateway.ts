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
  async fetchDashboardData(
    rpgId: string,
  ): Promise<{ items: BaseItemDto[]; characters: CharacterSummaryDto[] }> {
    const response = await fetch(`/api/rpg/${rpgId}/items/dashboard`)
    const payload = await parseJson<{
      items?: BaseItemDto[]
      characters?: CharacterSummaryDto[]
    }>(response)
    return {
      items: payload.items ?? [],
      characters: payload.characters ?? [],
    }
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
