import type { NextRequest } from "next/server"
import {
  createLibraryBookHandler,
  listLibrarySectionBooksHandler,
} from "@/backend/routes/library/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; sectionId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId, sectionId } = await context.params
  return listLibrarySectionBooksHandler(request, { rpgId, sectionId })
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { rpgId, sectionId } = await context.params
  return createLibraryBookHandler(request, { rpgId, sectionId })
}
