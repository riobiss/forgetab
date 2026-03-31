import type { NextRequest } from "next/server"
import {
  createLibrarySectionHandler,
  listLibrarySectionsHandler,
} from "@/backend/routes/library/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return listLibrarySectionsHandler(request, { rpgId })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { rpgId } = await context.params
  return createLibrarySectionHandler(request, { rpgId })
}
