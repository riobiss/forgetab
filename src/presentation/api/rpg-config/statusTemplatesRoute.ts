import type { NextRequest } from "next/server"
import {
  getStatusTemplatesHandler,
  updateStatusTemplatesHandler,
} from "@/backend/routes/rpgConfig/handlers"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return getStatusTemplatesHandler(request, { rpgId })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return updateStatusTemplatesHandler(request, { rpgId })
}
