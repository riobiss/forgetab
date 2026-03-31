import {
  deleteItemHandler,
  getItemByIdHandler,
  updateItemHandler,
} from "@/backend/routes/items/handlers"
import { revalidateItemsListTags } from "@/presentation/api/items/cacheTags"
import { getUserIdFromRequest } from "@/presentation/api/items/requestAuth"

type RouteContext = {
  params: Promise<{
    rpgId: string
    itemId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  return getItemByIdHandler(request, await context.params)
}

export async function PATCH(request: Request, context: RouteContext) {
  const { rpgId } = await context.params
  const userId = await getUserIdFromRequest(request)
  const response = await updateItemHandler(request, await context.params)
  if (response.ok && userId) {
    revalidateItemsListTags({ userId, rpgId })
  }
  return response
}

export async function DELETE(request: Request, context: RouteContext) {
  const { rpgId } = await context.params
  const userId = await getUserIdFromRequest(request)
  const response = await deleteItemHandler(request, await context.params)
  if (response.ok && userId) {
    revalidateItemsListTags({ userId, rpgId })
  }
  return response
}
