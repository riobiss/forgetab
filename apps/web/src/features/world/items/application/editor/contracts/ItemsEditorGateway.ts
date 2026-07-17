import type {
  ItemEditorDetailDto,
  UpsertItemPayloadDto,
} from "@/features/world/items/application/editor/types"

export interface ItemsEditorGateway {
  fetchItem(rpgId: string, itemId: string): Promise<ItemEditorDetailDto>
  createItem(
    rpgId: string,
    payload: UpsertItemPayloadDto,
  ): Promise<ItemEditorDetailDto>
  updateItem(
    rpgId: string,
    itemId: string,
    payload: UpsertItemPayloadDto,
  ): Promise<ItemEditorDetailDto>
  uploadItemImage(file: File): Promise<{ url: string }>
  deleteItemImageByUrl(url: string): Promise<void>
}
