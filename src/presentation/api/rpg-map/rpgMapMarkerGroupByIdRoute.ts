import type { NextRequest } from "next/server"
import {
  deleteRpgMapMarkerGroupHandler,
  updateRpgMapMarkerGroupHandler,
} from "@/backend/routes/rpgMap/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; mapId: string; groupId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId, groupId } = await context.params
  return updateRpgMapMarkerGroupHandler(request, { rpgId, mapId, groupId })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId, groupId } = await context.params
  return deleteRpgMapMarkerGroupHandler(request, { rpgId, mapId, groupId })
}
