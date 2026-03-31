import type { NextRequest } from "next/server"
import {
  deleteRpgMapSectionHandler,
  updateRpgMapSectionHandler,
} from "@/backend/routes/rpgMap/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; mapId: string; sectionId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId, sectionId } = await context.params
  return updateRpgMapSectionHandler(request, { rpgId, mapId, sectionId })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId, sectionId } = await context.params
  return deleteRpgMapSectionHandler(request, { rpgId, mapId, sectionId })
}
