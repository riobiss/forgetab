import type { NextRequest } from "next/server"
import {
  deleteLibraryBookHandler,
  getLibraryBookHandler,
  updateLibraryBookHandler,
} from "@/backend/routes/library/handlers"

type RouteContext = {
  params: Promise<{ rpgId: string; bookId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { rpgId, bookId } = await context.params
  return getLibraryBookHandler(request, { rpgId, bookId })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { rpgId, bookId } = await context.params
  return updateLibraryBookHandler(request, { rpgId, bookId })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { rpgId, bookId } = await context.params
  return deleteLibraryBookHandler(request, { rpgId, bookId })
}
