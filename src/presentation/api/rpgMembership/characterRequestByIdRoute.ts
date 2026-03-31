import { processCharacterRequestHandler } from "@/backend/routes/rpgMembership/handlers"

type RouteContext = { params: Promise<{ rpgId: string; requestId: string }> }

export async function PATCH(request: Request, context: RouteContext) {
  return processCharacterRequestHandler(request, await context.params)
}
