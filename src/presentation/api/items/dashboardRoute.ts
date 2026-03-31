import { getItemsDashboardHandler } from "@/backend/routes/items/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  return getItemsDashboardHandler(request, await context.params)
}
