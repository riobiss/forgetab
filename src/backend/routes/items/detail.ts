import { deleteItem } from "@/application/items/use-cases/deleteItem"
import { getItemById } from "@/application/items/use-cases/getItemById"
import { updateItem } from "@/application/items/use-cases/updateItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/infrastructure/items/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { type ItemRouteParams, requireUserId } from "./shared"

export async function getItemByIdHandler(request: Request, params: ItemRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItemById(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: params.rpgId, itemId: params.itemId, userId: auth.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar item.")
  }
}

export async function updateItemHandler(request: Request, params: ItemRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await updateItem(
      {
        repository: prismaItemRepository,
        permissionService: rpgPermissionService,
        imageStorageService: imageKitItemImageStorageService,
      },
      { rpgId: params.rpgId, itemId: params.itemId, userId: auth.userId, body },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar item.")
  }
}

export async function deleteItemHandler(request: Request, params: ItemRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await deleteItem(
      {
        repository: prismaItemRepository,
        permissionService: rpgPermissionService,
        imageStorageService: imageKitItemImageStorageService,
      },
      { rpgId: params.rpgId, itemId: params.itemId, userId: auth.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao deletar item.")
  }
}
