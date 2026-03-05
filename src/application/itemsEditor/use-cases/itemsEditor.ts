import type { ItemsEditorDependencies } from "@/application/itemsEditor/contracts/ItemsEditorDependencies"
import type { UpsertItemPayloadDto } from "@/application/itemsEditor/types"

type Dependencies = ItemsEditorDependencies

export async function loadItemDetailUseCase(
  deps: Dependencies,
  params: { rpgId: string; itemId: string },
) {
  return deps.gateway.fetchItem(params.rpgId, params.itemId)
}

export async function createItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: UpsertItemPayloadDto },
) {
  return deps.gateway.createItem(params.rpgId, params.payload)
}

export async function updateItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; itemId: string; payload: UpsertItemPayloadDto },
) {
  return deps.gateway.updateItem(params.rpgId, params.itemId, params.payload)
}

export async function uploadItemImageUseCase(
  deps: Dependencies,
  params: { file: File },
) {
  return deps.gateway.uploadItemImage(params.file)
}

export async function deleteItemImageByUrlUseCase(
  deps: Dependencies,
  params: { url: string },
) {
  return deps.gateway.deleteItemImageByUrl(params.url)
}
