import type { ItemsDashboardGateway } from "@/features/world/items/application/dashboard/contracts/ItemsDashboardGateway"
import type {
  BaseItemDto,
  CharacterSummaryDto,
  GiveItemPayloadDto,
  ItemEditorDetailDto,
  UpsertItemPayloadDto
} from "@/features/world/items/application/dashboard/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse as parseJson } from "@/features/http/infrastructure/parseApiResponse"

function itemPath(rpgId: string, itemId?: string) {
  const basePath = `/api/rpg/${encodeURIComponent(rpgId)}/items`
  return itemId ? `${basePath}/${encodeURIComponent(itemId)}` : basePath
}

export const httpItemsDashboardGateway: ItemsDashboardGateway = {
  async fetchDashboardData(
    rpgId: string
  ): Promise<{ items: BaseItemDto[]; characters: CharacterSummaryDto[] }> {
    const response = await apiFetch(`${itemPath(rpgId)}/dashboard`)
    const payload = await parseJson<{
      items?: BaseItemDto[]
      characters?: CharacterSummaryDto[]
    }>(response)
    return {
      items: payload.items ?? [],
      characters: payload.characters ?? []
    }
  },

  async fetchItem(rpgId: string, itemId: string): Promise<ItemEditorDetailDto> {
    const response = await apiFetch(itemPath(rpgId, itemId))
    const payload = await parseJson<{ item?: ItemEditorDetailDto }>(response)
    if (!payload.item) throw new Error("Nao foi possivel carregar o item.")
    return payload.item
  },

  async createItem(
    rpgId: string,
    payload: UpsertItemPayloadDto
  ): Promise<ItemEditorDetailDto> {
    const response = await apiFetch(itemPath(rpgId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const result = await parseJson<{ item?: ItemEditorDetailDto }>(response)
    if (!result.item) throw new Error("Nao foi possivel salvar o item.")
    return result.item
  },

  async updateItem(
    rpgId: string,
    itemId: string,
    payload: UpsertItemPayloadDto
  ): Promise<ItemEditorDetailDto> {
    const response = await apiFetch(itemPath(rpgId, itemId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const result = await parseJson<{ item?: ItemEditorDetailDto }>(response)
    if (!result.item) throw new Error("Nao foi possivel salvar o item.")
    return result.item
  },

  async uploadItemImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiFetch("/api/uploads/item-image", {
      method: "POST",
      body: formData
    })
    const result = await parseJson<{ url?: string }>(response)
    if (!result.url) throw new Error("Nao foi possivel enviar imagem.")
    return { url: result.url.trim() }
  },

  async deleteItemImageByUrl(url: string): Promise<void> {
    const response = await apiFetch("/api/uploads/item-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    })
    await parseJson<{ message?: string }>(response)
  },

  async deleteItem(rpgId: string, itemId: string): Promise<void> {
    const response = await apiFetch(itemPath(rpgId, itemId), {
      method: "DELETE"
    })
    await parseJson<{ message?: string }>(response)
  },

  async giveItem(
    rpgId: string,
    payload: GiveItemPayloadDto
  ): Promise<{ message: string }> {
    const response = await apiFetch(`${itemPath(rpgId)}/give`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const result = await parseJson<{ message?: string }>(response)
    return { message: result.message ?? "Item entregue com sucesso." }
  }
}
