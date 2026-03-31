import {
  getCharacterRequestsHandler,
  requestCharacterCreationHandler,
} from "@/backend/routes/rpgMembership/handlers"

type RouteContext = { params: Promise<{ rpgId: string }> }

export async function GET(request: Request, context: RouteContext) {
  return getCharacterRequestsHandler(request, await context.params)
}

export async function POST(request: Request, context: RouteContext) {
  return requestCharacterCreationHandler(request, await context.params)
}
