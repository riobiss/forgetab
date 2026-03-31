import {
  createCharacterInventoryHandler,
  getCharacterInventoryHandler,
  removeCharacterInventoryHandler,
} from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  return getCharacterInventoryHandler(request, await context.params)
}

export async function POST(request: Request, context: RouteContext) {
  void request
  void context
  return createCharacterInventoryHandler()
}

export async function DELETE(request: Request, context: RouteContext) {
  return removeCharacterInventoryHandler(request, await context.params)
}
