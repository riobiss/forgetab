import { NextRequest, NextResponse } from "next/server"
import { updateCharacterStatusCurrentUseCase } from "@/application/characterStatusCurrent/use-cases/characterStatusCurrent"
import { prismaCharacterStatusCurrentRepository } from "@/infrastructure/characterStatusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, characterId } = await context.params
    const body = (await request.json()) as { key?: unknown; value?: unknown }

    const payload = await updateCharacterStatusCurrentUseCase(
      prismaCharacterStatusCurrentRepository,
      { rpgId, characterId, userId, body },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "current_statuses" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return toErrorResponse(error, "Erro interno ao salvar status atual.")
  }
}
