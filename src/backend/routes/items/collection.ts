import { createItem } from "@/application/items/use-cases/createItem"
import { getItems } from "@/application/items/use-cases/getItems"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { type RpgRouteParams, requireUserId } from "./shared"

export function getItemsPayload(rpgId: string, userId: string) {
  return getItems(
    { repository: prismaItemRepository, permissionService: rpgPermissionService },
    { rpgId, userId },
  )
}

export async function listItemsHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItemsPayload(params.rpgId, auth.userId)
    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar itens.")
  }
}

export async function createItemHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await createItem(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: params.rpgId, userId: auth.userId, body },
    )

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar item.")
  }
}
