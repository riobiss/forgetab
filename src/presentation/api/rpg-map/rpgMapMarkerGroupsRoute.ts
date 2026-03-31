import type { NextRequest } from "next/server"
import { createRpgMapMarkerGroupHandler } from "@/backend/routes/rpgMap/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; mapId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { rpgId, mapId } = await context.params
  return createRpgMapMarkerGroupHandler(request, { rpgId, mapId })
}
