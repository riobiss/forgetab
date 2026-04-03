import { getItemsDashboardData } from "@/application/items/use-cases/getItemsDashboardData"
import { giveItem } from "@/application/items/use-cases/giveItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { type RpgRouteParams, requireUserId } from "./shared"

export async function getItemsDashboardHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItemsDashboardData(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: params.rpgId, userId: auth.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar dashboard de itens.")
  }
}

export async function giveItemHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await request.json()
    const payload = await giveItem(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: params.rpgId, userId: auth.userId, body },
    )

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao dar item para os players.")
  }
}
