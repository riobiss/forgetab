import { NextRequest, NextResponse } from "next/server"
import { buyCharacterSkillUseCase, removeCharacterSkillUseCase } from "@/application/characterAbilities/use-cases/characterSkillPurchase"
import { legacyCharacterSkillPurchaseService } from "@/infrastructure/characterAbilities/services/legacyCharacterSkillPurchaseService"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id } = await context.params
    const payload = await buyCharacterSkillUseCase(
      { service: legacyCharacterSkillPurchaseService },
      { characterId: id, userId, payload: await request.json() },
    )

    return NextResponse.json(payload, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao comprar habilidade.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id } = await context.params
    const payload = await removeCharacterSkillUseCase(
      { service: legacyCharacterSkillPurchaseService },
      { characterId: id, userId, payload: await request.json() },
    )

    return NextResponse.json(payload, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover habilidade.")
  }
}
