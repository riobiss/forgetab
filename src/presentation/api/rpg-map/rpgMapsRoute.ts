import type { NextRequest } from "next/server"
import { createRpgMapHandler, listRpgMapsHandler } from "@/backend/routes/rpgMap/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return listRpgMapsHandler(request, { rpgId })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return createRpgMapHandler(request, { rpgId })
}
