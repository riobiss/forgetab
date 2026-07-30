import type { ItemImageStorageService } from "@/features/world/item/application/ports/ItemImageStorageService"
import type { ItemUpdateRepository } from "@/features/world/item/application/ports/ItemRepository"
import type { RpgPermissionService } from "@/features/world/item/application/ports/RpgPermissionService"
import {
  ensureCanManageRpg,
  mapBaseItemsError,
  parseAndNormalizeBaseItem,
} from "@/features/world/item/application/use-cases/shared"
import { AppError } from "@/features/shared/application/errors/AppError"

type UpdateItemDeps = {
  repository: ItemUpdateRepository
  permissionService: RpgPermissionService
  imageStorageService: ItemImageStorageService
}

export async function updateItem(
  deps: UpdateItemDeps,
  params: { rpgId: string; itemId: string; userId: string; body: unknown },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(params.rpgId, params.userId)
    ensureCanManageRpg(canManage)

    const existing = await deps.repository.findById(params.rpgId, params.itemId)
    if (!existing) {
      throw new AppError("Item nao encontrado.", 404)
    }

    const input = parseAndNormalizeBaseItem(params.body)
    const item = await deps.repository.update(params.rpgId, params.itemId, input)
    if (!item) {
      throw new AppError("Item nao encontrado.", 404)
    }

    if (existing.image && existing.image !== input.image) {
      try {
        await deps.imageStorageService.deleteItemImageByUrl(params.userId, existing.image)
      } catch {
        // Nao bloqueia a atualizacao caso a limpeza da imagem falhe.
      }
    }

    return { item }
  } catch (error) {
    mapBaseItemsError(error, "Erro interno ao atualizar item.")
  }
}
