import type { ItemRepository } from "@/application/items/ports/ItemRepository"
import type { RpgPermissionService } from "@/application/items/ports/RpgPermissionService"
import { ensureCanManageRpg, mapBaseItemsError } from "@/application/items/use-cases/shared"
import { AppError } from "@/shared/errors/AppError"

type GetItemByIdDeps = {
  repository: ItemRepository
  permissionService: RpgPermissionService
}

export async function getItemById(
  deps: GetItemByIdDeps,
  params: { rpgId: string; itemId: string; userId: string },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(params.rpgId, params.userId)
    ensureCanManageRpg(canManage)

    const item = await deps.repository.findById(params.rpgId, params.itemId)
    if (!item) {
      throw new AppError("Item nao encontrado.", 404)
    }

    return { item }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao buscar item.")
  }
}
