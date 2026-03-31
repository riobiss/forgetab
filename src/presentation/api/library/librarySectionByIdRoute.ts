import type { NextRequest } from "next/server"
import {
  deleteLibrarySectionHandler,
  getLibrarySectionHandler,
  updateLibrarySectionHandler,
} from "@/backend/routes/library/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; sectionId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId, sectionId } = await context.params
  return getLibrarySectionHandler(request, { rpgId, sectionId })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rpgId, sectionId } = await context.params
  return updateLibrarySectionHandler(request, { rpgId, sectionId })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { rpgId, sectionId } = await context.params
  return deleteLibrarySectionHandler(request, { rpgId, sectionId })
}
