import { NextResponse, type NextRequest } from "next/server"
import {
  expelMemberUseCase,
  processMemberActionUseCase,
} from "@/application/rpgMembership/use-cases/rpgMembership"
import { prismaRpgMembershipRepository } from "@/infrastructure/rpgMembership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/infrastructure/rpgMembership/services/rpgMembershipAccessService"
import { getUserIdFromRequest } from "@/presentation/api/rpgMembership/requestAuth"
import { toErrorResponse } from "@/presentation/api/rpgMembership/toErrorResponse"

type RouteContext = { params: Promise<{ rpgId: string; memberId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    const { rpgId, memberId } = await context.params
    const body = (await request.json()) as { action?: "accept" | "reject" | "toggleModerator" }
    if (!body.action || !["accept", "reject", "toggleModerator"].includes(body.action)) {
      return NextResponse.json({ message: "Acao invalida." }, { status: 400 })
    }
    const payload = await processMemberActionUseCase(rpgMembershipAccessService, prismaRpgMembershipRepository, {
      rpgId,
      userId,
      memberId,
      action: body.action,
    })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao processar solicitacao.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    const { rpgId, memberId } = await context.params
    const payload = await expelMemberUseCase(rpgMembershipAccessService, prismaRpgMembershipRepository, {
      rpgId,
      userId,
      memberId,
    })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao expulsar membro.")
  }
}

