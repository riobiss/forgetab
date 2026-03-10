import { NextResponse, type NextRequest } from "next/server"
import {
  listRpgMembersUseCase,
  requestJoinRpgUseCase,
} from "@/application/rpgMembership/use-cases/rpgMembership"
import { prismaRpgMembershipRepository } from "@/infrastructure/rpgMembership/repositories/prismaRpgMembershipRepository"
import { getUserIdFromRequest } from "@/presentation/api/rpgMembership/requestAuth"
import { toErrorResponse } from "@/presentation/api/rpgMembership/toErrorResponse"

type RouteContext = { params: Promise<{ rpgId: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    const { rpgId } = await context.params
    const payload = await listRpgMembersUseCase(prismaRpgMembershipRepository, { rpgId, userId })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar membros.")
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    const { rpgId } = await context.params
    const payload = await requestJoinRpgUseCase(prismaRpgMembershipRepository, { rpgId, userId })
    return NextResponse.json({ message: payload.message }, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao solicitar participacao.")
  }
}

