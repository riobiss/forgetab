import type { ItemsDashboardGateway } from "@/application/itemsDashboard/contracts/ItemsDashboardGateway"
import type {
  BaseItemDto,
  CharacterSummaryDto,
  GiveItemPayloadDto,
} from "@/application/itemsDashboard/types"
import type { ItemEditorDetailDto, UpsertItemPayloadDto } from "@/application/itemsEditor/types"

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

  async fetchItem(rpgId: string, itemId: string): Promise<ItemEditorDetailDto> {
    const response = await fetch(`/api/rpg/${rpgId}/items/${itemId}`)
    const payload = await parseJson<{ item?: ItemEditorDetailDto }>(response)
    if (!payload.item) throw new Error("Nao foi possivel carregar o item.")
    return payload.item
  },

  async createItem(rpgId: string, payload: UpsertItemPayloadDto): Promise<ItemEditorDetailDto> {
    const response = await fetch(`/api/rpg/${rpgId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ item?: ItemEditorDetailDto }>(response)
    if (!result.item) throw new Error("Nao foi possivel salvar o item.")
    return result.item
  },

  async updateItem(rpgId: string, itemId: string, payload: UpsertItemPayloadDto): Promise<ItemEditorDetailDto> {
    const response = await fetch(`/api/rpg/${rpgId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ item?: ItemEditorDetailDto }>(response)
    if (!result.item) throw new Error("Nao foi possivel salvar o item.")
    return result.item
  },

  async uploadItemImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/uploads/item-image", {
      method: "POST",
      body: formData,
    })
    const result = await parseJson<{ url?: string }>(response)
    if (!result.url) throw new Error("Nao foi possivel enviar imagem.")
    return { url: result.url.trim() }
  },

  async deleteItemImageByUrl(url: string): Promise<void> {
    const response = await fetch("/api/uploads/item-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    await parseJson<{ message?: string }>(response)
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
