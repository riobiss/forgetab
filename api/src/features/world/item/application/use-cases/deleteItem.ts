import type { ItemImageStorageService } from "@/features/world/item/application/ports/ItemImageStorageService"
import type { ItemDeleteRepository } from "@/features/world/item/application/ports/ItemRepository"
import type { RpgPermissionService } from "@/features/world/item/application/ports/RpgPermissionService"
import { ensureCanManageRpg, mapBaseItemsError } from "@/features/world/item/application/use-cases/shared"
import { AppError } from "@/features/shared/application/errors/AppError"

type DeleteItemDeps = {
  repository: ItemDeleteRepository
  permissionService: RpgPermissionService
  imageStorageService: ItemImageStorageService
}

export async function deleteItem(
  deps: DeleteItemDeps,
  params: { rpgId: string; itemId: string; userId: string },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(params.rpgId, params.userId)
    ensureCanManageRpg(canManage)

    const deleted = await deps.repository.delete(params.rpgId, params.itemId)
    if (!deleted) {
      throw new AppError("Item nao encontrado.", 404)
    }

    try {
      await deps.imageStorageService.deleteItemImageByUrl(params.userId, deleted.image)
    } catch {
      // Nao bloqueia a exclusao caso a limpeza da imagem falhe.
    }

    return { message: "Item deletado com sucesso." }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao deletar item.")
  }
}
