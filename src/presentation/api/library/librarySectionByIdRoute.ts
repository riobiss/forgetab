import { NextResponse, type NextRequest } from "next/server"
import {
  deleteLibrarySection,
  getLibrarySection,
  updateLibrarySection,
} from "@/application/library/use-cases/libraryApi"
import { prismaLibraryRepository } from "@/infrastructure/library/repositories/prismaLibraryRepository"
import { legacyLibraryAccessService } from "@/infrastructure/library/services/legacyLibraryAccessService"
import { getUserIdFromRequest } from "./requestAuth"
import { toErrorResponse } from "./toErrorResponse"

type RouteContext = {
  params: Promise<{ rpgId: string; sectionId: string }>
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
    const { rpgId, sectionId } = await context.params
    const payload = await getLibrarySection(deps, { rpgId, sectionId, userId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar secao.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, sectionId } = await context.params
    const body = await request.json()
    const payload = await updateLibrarySection(deps, { rpgId, sectionId, userId, body })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar secao.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, sectionId } = await context.params
    const payload = await deleteLibrarySection(deps, { rpgId, sectionId, userId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover secao.")
  }
}
