import type { NextRequest } from "next/server"
import { reorderRpgMapSectionHandler } from "@/backend/routes/rpgMap/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; mapId: string; sectionId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId, sectionId } = await context.params
  return reorderRpgMapSectionHandler(request, { rpgId, mapId, sectionId })
}
