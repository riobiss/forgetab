import {
  deleteCharacterHandler,
  getCharacterByIdHandler,
  updateCharacterHandler,
} from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  return getCharacterByIdHandler(request, await context.params)
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateCharacterHandler(request, await context.params)
}

export async function DELETE(request: Request, context: RouteContext) {
  return deleteCharacterHandler(request, await context.params)
}
