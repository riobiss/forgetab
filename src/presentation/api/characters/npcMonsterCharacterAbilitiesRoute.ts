import {
  addNpcMonsterCharacterAbilityHandler,
  getNpcMonsterCharacterAbilitiesHandler,
  removeNpcMonsterCharacterAbilityHandler,
} from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function GET(request: Request, context: RouteContext) {
  return getNpcMonsterCharacterAbilitiesHandler(request, await context.params)
}

export async function POST(request: Request, context: RouteContext) {
  return addNpcMonsterCharacterAbilityHandler(request, await context.params)
}

export async function DELETE(request: Request, context: RouteContext) {
  return removeNpcMonsterCharacterAbilityHandler(request, await context.params)
}
