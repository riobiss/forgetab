import type { NextRequest } from "next/server"
import {
  deleteRpgHandler,
  getRpgByIdHandler,
  updateRpgHandler,
} from "@/backend/routes/rpg/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return getRpgByIdHandler(request, { rpgId })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return updateRpgHandler(request, { rpgId })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return deleteRpgHandler(request, { rpgId })
}
