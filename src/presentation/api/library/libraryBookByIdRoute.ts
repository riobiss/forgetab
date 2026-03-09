import { NextResponse, type NextRequest } from "next/server"
import {
  deleteLibraryBook,
  getLibraryBook,
  updateLibraryBook,
} from "@/application/library/use-cases/libraryApi"
import { prismaLibraryRepository } from "@/infrastructure/library/repositories/prismaLibraryRepository"
import { legacyLibraryAccessService } from "@/infrastructure/library/services/legacyLibraryAccessService"
import { getUserIdFromRequest } from "./requestAuth"
import { toErrorResponse } from "./toErrorResponse"

type RouteContext = {
  params: Promise<{ rpgId: string; bookId: string }>
}

const deps = {
  repository: prismaLibraryRepository,
  accessService: legacyLibraryAccessService,
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, bookId } = await context.params
    const payload = await getLibraryBook(deps, { rpgId, bookId, userId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar livro.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, bookId } = await context.params
    const body = await request.json()
    const payload = await updateLibraryBook(deps, { rpgId, bookId, userId, body })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar livro.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, bookId } = await context.params
    const payload = await deleteLibraryBook(deps, { rpgId, bookId, userId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover livro.")
  }
}
