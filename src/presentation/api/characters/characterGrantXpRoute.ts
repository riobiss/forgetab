import { grantCharacterXpHandler } from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  return grantCharacterXpHandler(request, await context.params)
}
