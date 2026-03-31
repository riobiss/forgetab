import { createItem } from "@/application/items/use-cases/createItem"
import { deleteItem } from "@/application/items/use-cases/deleteItem"
import { getItemById } from "@/application/items/use-cases/getItemById"
import { getItemsDashboardData } from "@/application/items/use-cases/getItemsDashboardData"
import { getItems } from "@/application/items/use-cases/getItems"
import { giveItem } from "@/application/items/use-cases/giveItem"
import { updateItem } from "@/application/items/use-cases/updateItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/infrastructure/items/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { getUserIdFromRequest } from "@/backend/auth/requestAuth"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"

type RpgRouteParams = { rpgId: string }
type ItemRouteParams = { rpgId: string; itemId: string }

async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}

export async function listItemsHandler(request: Request, params: RpgRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = await getItems(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId: params.rpgId, userId: auth.userId },
    )

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
