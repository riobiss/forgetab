import {
  buyCharacterSkillHandler,
  removeCharacterSkillHandler,
} from "@/backend/routes/characters/handlers"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: Request, context: RouteContext) {
  return buyCharacterSkillHandler(request, await context.params)
}

export async function DELETE(request: Request, context: RouteContext) {
  return removeCharacterSkillHandler(request, await context.params)
}
