import type { ItemRepository } from "@/application/items/ports/ItemRepository"
import type { RpgPermissionService } from "@/application/items/ports/RpgPermissionService"
import {
  ensureCanManageRpg,
  mapBaseItemsError,
  parseAndNormalizeBaseItem,
} from "@/application/items/use-cases/shared"

type CreateItemDeps = {
  repository: ItemRepository
  permissionService: RpgPermissionService
}

export async function createItem(
  deps: CreateItemDeps,
  params: { rpgId: string; userId: string; body: unknown },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(params.rpgId, params.userId)
    ensureCanManageRpg(canManage)

    const input = parseAndNormalizeBaseItem(params.body)
    const item = await deps.repository.create(params.rpgId, input)
    return { item }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao criar item.")
  }
}
