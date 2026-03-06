import { NextRequest, NextResponse } from "next/server"
import { deleteItem } from "@/application/items/use-cases/deleteItem"
import { getItemById } from "@/application/items/use-cases/getItemById"
import { updateItem } from "@/application/items/use-cases/updateItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/infrastructure/items/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { revalidateItemsListTags } from "@/presentation/api/items/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"
import { toErrorResponse } from "@/presentation/api/items/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
    itemId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, itemId } = await context.params
    const payload = await getItemById(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId, itemId, userId },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar item.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, itemId } = await context.params
    const body = await request.json()
    const payload = await updateItem(
      {
        repository: prismaItemRepository,
        permissionService: rpgPermissionService,
        imageStorageService: imageKitItemImageStorageService,
      },
      { rpgId, itemId, userId, body },
    )
    revalidateItemsListTags({ userId, rpgId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar item.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, itemId } = await context.params
    const payload = await deleteItem(
      {
        repository: prismaItemRepository,
        permissionService: rpgPermissionService,
        imageStorageService: imageKitItemImageStorageService,
      },
      { rpgId, itemId, userId },
    )
    revalidateItemsListTags({ userId, rpgId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao deletar item.")
  }
}
