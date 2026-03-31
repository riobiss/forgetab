import { listItemsHandler, createItemHandler } from "@/backend/routes/items/handlers"
import {
  buildItemsListTagList,
  revalidateItemsListTags,
} from "@/presentation/api/items/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"
import { unstable_cache } from "next/cache"
import { getItems } from "@/application/items/use-cases/getItems"
import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"
import { NextResponse } from "next/server"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
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
    return listItemsHandler(request, await context.params)
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { rpgId } = await context.params
  const userId = await getUserIdFromRequest(request)
  const response = await createItemHandler(request, { rpgId })
  if (response.ok && userId) {
    revalidateItemsListTags({ userId, rpgId })
  }
  return response
}
