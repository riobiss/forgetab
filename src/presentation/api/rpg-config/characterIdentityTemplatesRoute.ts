import type { NextRequest } from "next/server"
import {
  getIdentityTemplatesHandler,
  updateIdentityTemplatesHandler,
} from "@/backend/routes/rpgConfig/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return getIdentityTemplatesHandler(request, { rpgId })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return updateIdentityTemplatesHandler(request, { rpgId })
}
