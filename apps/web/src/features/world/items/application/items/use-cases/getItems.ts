import type { ItemRepository } from "@/features/world/items/application/items/ports/ItemRepository"
import type { RpgPermissionService } from "@/features/world/items/application/items/ports/RpgPermissionService"
import {
  ensureCanManageRpg,
  mapBaseItemsError,
} from "@/features/world/items/application/items/use-cases/shared"

type GetItemsDeps = {
  repository: ItemRepository
  permissionService: RpgPermissionService
}

export async function getItems(
  deps: GetItemsDeps,
  params: { rpgId: string; userId: string },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(
      params.rpgId,
      params.userId,
    )
    ensureCanManageRpg(canManage)

    const items = await deps.repository.listByRpg(params.rpgId)
    return { items }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao listar itens.")
  }
}
