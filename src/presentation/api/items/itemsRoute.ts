import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { createItem } from "@/application/items/use-cases/createItem"
import { getItems } from "@/application/items/use-cases/getItems"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"
import { toErrorResponse } from "@/presentation/api/items/toErrorResponse"
import {
  buildItemsListTagList,
  revalidateItemsListTags,
} from "@/presentation/api/items/cacheTags"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId } = await context.params
    const cacheKey = ["items-list", userId, rpgId]
    const tags = buildItemsListTagList({ userId, rpgId })
    const getCachedItems = unstable_cache(
      () => getItems({ repository: prismaItemRepository, permissionService: rpgPermissionService }, { rpgId, userId }),
      cacheKey,
      {
        revalidate: 60,
        tags,
      },
    )

    const payload = await getCachedItems().catch(() =>
      getItems({ repository: prismaItemRepository, permissionService: rpgPermissionService }, { rpgId, userId }),
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar itens.")
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId } = await context.params
    const body = await request.json()
    const payload = await createItem(
      { repository: prismaItemRepository, permissionService: rpgPermissionService },
      { rpgId, userId, body },
    )
    revalidateItemsListTags({ userId, rpgId })
    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar item.")
  }
}
