import { NextResponse, type NextRequest } from "next/server"
import { processCharacterRequestUseCase } from "@/application/rpgMembership/use-cases/rpgMembership"
import { prismaRpgMembershipRepository } from "@/infrastructure/rpgMembership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/infrastructure/rpgMembership/services/rpgMembershipAccessService"
import { getUserIdFromRequest } from "@/presentation/api/rpgMembership/requestAuth"
import { toErrorResponse } from "@/presentation/api/rpgMembership/toErrorResponse"

type RouteContext = { params: Promise<{ rpgId: string; requestId: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    const { rpgId, requestId } = await context.params
    const body = (await request.json()) as { action?: "accept" | "reject" }
    if (!body.action || !["accept", "reject"].includes(body.action)) {
      return NextResponse.json({ message: "Acao invalida." }, { status: 400 })
    }
    const payload = await processCharacterRequestUseCase(
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
      { rpgId, userId, requestId, action: body.action },
    )
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao processar solicitacao de personagem.")
  }
}
