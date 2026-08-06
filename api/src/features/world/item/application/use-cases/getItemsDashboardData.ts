import type { ItemsDashboardRepository } from "@/features/world/item/application/ports/ItemRepository"
import type { RpgPermissionService } from "@/features/world/item/application/ports/RpgPermissionService"
import {
  ensureCanManageRpg,
  mapBaseItemsError
} from "@/features/world/item/application/use-cases/shared"

type GetItemsDashboardDataDeps = {
  repository: ItemsDashboardRepository
  permissionService: RpgPermissionService
}

export async function getItemsDashboardData(
  deps: GetItemsDashboardDataDeps,
  params: { rpgId: string; userId: string }
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(
      params.rpgId,
      params.userId
    )
    ensureCanManageRpg(canManage)

    const [items, characters] = await Promise.all([
      deps.repository.listByRpg(params.rpgId),
      deps.repository.listCharacterSummaries(params.rpgId)
    ])

    return { items, characters }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao carregar dashboard de itens.")
  }
}
