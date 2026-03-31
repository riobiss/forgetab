import type { NextRequest } from "next/server"
import {
  deleteRpgMapHandler,
  getRpgMapDetailHandler,
  updateRpgMapHandler,
} from "@/backend/routes/rpgMap/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; mapId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId } = await context.params
  return getRpgMapDetailHandler(request, { rpgId, mapId })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId } = await context.params
  return updateRpgMapHandler(request, { rpgId, mapId })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId } = await context.params
  return deleteRpgMapHandler(request, { rpgId, mapId })
}
