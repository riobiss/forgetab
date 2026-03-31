import { updateCharacterStatusCurrentHandler } from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateCharacterStatusCurrentHandler(request, await context.params)
}
