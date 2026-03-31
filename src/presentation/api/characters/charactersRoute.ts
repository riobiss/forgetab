import { createCharacterHandler, listCharactersHandler } from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  return listCharactersHandler(request, await context.params)
}

export async function POST(request: Request, context: RouteContext) {
  return createCharacterHandler(request, await context.params)
}
