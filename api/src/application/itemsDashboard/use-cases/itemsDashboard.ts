import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import type { GiveItemPayloadDto } from "@/application/itemsDashboard/types"
import type { UpsertItemPayloadDto } from "@/application/itemsEditor/types"

type Dependencies = ItemsDashboardDependencies

export async function loadItemsDashboardData(deps: Dependencies, params: { rpgId: string }) {
  return deps.gateway.fetchDashboardData(params.rpgId)
}

export async function deleteItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; itemId: string },
) {
  await deps.gateway.deleteItem(params.rpgId, params.itemId)
}

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

export async function giveItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: GiveItemPayloadDto },
) {
  return deps.gateway.giveItem(params.rpgId, params.payload)
}
