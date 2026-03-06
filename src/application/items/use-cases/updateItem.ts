import type { ItemImageStorageService } from "@/application/items/ports/ItemImageStorageService"
import type { ItemRepository } from "@/application/items/ports/ItemRepository"
import type { RpgPermissionService } from "@/application/items/ports/RpgPermissionService"
import {
  ensureCanManageRpg,
  mapBaseItemsError,
  parseAndNormalizeBaseItem,
} from "@/application/items/use-cases/shared"
import { AppError } from "@/shared/errors/AppError"

type UpdateItemDeps = {
  repository: ItemRepository
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
