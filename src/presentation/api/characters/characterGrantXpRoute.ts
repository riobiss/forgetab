import { NextRequest, NextResponse } from "next/server"
import { grantCharacterXpUseCase } from "@/application/characterProgression/use-cases/characterProgression"
import { prismaCharacterProgressionRepository } from "@/infrastructure/characterProgression/repositories/prismaCharacterProgressionRepository"
import { rpgCharacterProgressionPermissionService } from "@/infrastructure/characterProgression/services/rpgCharacterProgressionPermissionService"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

const deps = {
  repository: prismaCharacterProgressionRepository,
  permissionService: rpgCharacterProgressionPermissionService,
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { id } = await context.params
    const body = (await request.json()) as { amount?: unknown }
    const payload = await grantCharacterXpUseCase(deps, {
      characterId: id,
      userId,
      amount: body.amount,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao conceder XP.")
  }
}
