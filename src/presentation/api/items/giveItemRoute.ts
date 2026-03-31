import { giveItemHandler } from "@/backend/routes/items/handlers"
import { revalidateItemsListTags } from "@/presentation/api/items/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  const { rpgId } = await context.params
  const userId = await getUserIdFromRequest(request)
  const response = await giveItemHandler(request, { rpgId })
  if (response.ok && userId) {
    revalidateItemsListTags({ userId, rpgId })
  }
  return response
}
