import {
  createItemHandler,
  getItemsPayload,
  listItemsHandler,
} from "@/backend/routes/items/handlers"
import {
  buildItemsListTagList,
  revalidateItemsListTags,
} from "@/presentation/api/items/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"
import { unstable_cache } from "next/cache"
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
      () => getItemsPayload(rpgId, userId),
      cacheKey,
      {
        revalidate: 60,
        tags,
      },
    )

    const payload = await getCachedItems().catch(() => getItemsPayload(rpgId, userId))

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
