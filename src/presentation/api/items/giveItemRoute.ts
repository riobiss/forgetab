import { NextRequest, NextResponse } from "next/server"
import { giveItem } from "@/application/items/use-cases/giveItem"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { revalidateItemsListTags } from "@/presentation/api/items/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"
import { toErrorResponse } from "@/presentation/api/items/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId } = await context.params
    const body = await request.json()
    const payload = await giveItem(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId, userId, body },
    )
    revalidateItemsListTags({ userId, rpgId })
    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao dar item para os players.")
  }
}
