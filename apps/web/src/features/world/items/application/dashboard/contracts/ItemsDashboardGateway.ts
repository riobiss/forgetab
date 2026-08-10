import type {
  BaseItemDto,
  CharacterSummaryDto,
  GiveItemPayloadDto,
  ItemEditorDetailDto,
  UpsertItemPayloadDto
} from "@/features/world/items/application/dashboard/types"
import type { UploadImageFile } from "@/features/media/application/types"

export interface ItemsDashboardGateway {
  fetchDashboardData(rpgId: string): Promise<{
    items: BaseItemDto[]
    characters: CharacterSummaryDto[]
  }>
  fetchItem(rpgId: string, itemId: string): Promise<ItemEditorDetailDto>
  createItem(
    rpgId: string,
    payload: UpsertItemPayloadDto
  ): Promise<ItemEditorDetailDto>
  updateItem(
    rpgId: string,
    itemId: string,
    payload: UpsertItemPayloadDto
  ): Promise<ItemEditorDetailDto>
  uploadItemImage(file: UploadImageFile): Promise<{ url: string }>
  deleteItemImageByUrl(url: string): Promise<void>
  deleteItem(rpgId: string, itemId: string): Promise<void>
  giveItem(
    rpgId: string,
    payload: GiveItemPayloadDto
  ): Promise<{ message: string }>
}
