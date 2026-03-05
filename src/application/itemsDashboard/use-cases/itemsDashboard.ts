import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import type { GiveItemPayloadDto } from "@/application/itemsDashboard/types"

type Dependencies = ItemsDashboardDependencies

export async function loadItemsDashboardData(deps: Dependencies, params: { rpgId: string }) {
  const [items, characters] = await Promise.all([
    deps.gateway.fetchItems(params.rpgId),
    deps.gateway.fetchCharacters(params.rpgId),
  ])

  return { items, characters }
}

export async function deleteItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; itemId: string },
) {
  await deps.gateway.deleteItem(params.rpgId, params.itemId)
}

export async function giveItemUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: GiveItemPayloadDto },
) {
  return deps.gateway.giveItem(params.rpgId, params.payload)
}
