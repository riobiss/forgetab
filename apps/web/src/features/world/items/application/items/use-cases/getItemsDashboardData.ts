import type { ItemRepository } from "@/features/world/items/application/items/ports/ItemRepository"
import type { RpgPermissionService } from "@/features/world/items/application/items/ports/RpgPermissionService"
import {
  ensureCanManageRpg,
  mapBaseItemsError,
} from "@/features/world/items/application/items/use-cases/shared"

type GetItemsDashboardDataDeps = {
  repository: ItemRepository
  permissionService: RpgPermissionService
}

export async function getItemsDashboardData(
  deps: GetItemsDashboardDataDeps,
  params: { rpgId: string; userId: string },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(
      params.rpgId,
      params.userId,
    )
    ensureCanManageRpg(canManage)

    const [items, characters] = await Promise.all([
      deps.repository.listByRpg(params.rpgId),
      deps.repository.listCharacterSummaries(params.rpgId),
    ])

    return { items, characters }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao carregar dashboard de itens.")
  }
}
