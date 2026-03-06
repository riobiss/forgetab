import { NextRequest, NextResponse } from "next/server"
import { createCharacter } from "@/application/characters/use-cases/createCharacter"
import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import { listCharacters } from "@/application/characters/use-cases/listCharacters"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { AppError } from "@/shared/errors/AppError"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  if (
    error instanceof Error &&
    (error.message.includes('column "use_inventory_weight_limit" does not exist') ||
      error.message.includes('column "allow_multiple_player_characters" does not exist') ||
      error.message.includes('column "progression_mode" does not exist') ||
      error.message.includes('column "progression_tiers" does not exist'))
  ) {
    return NextResponse.json(
      { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
      { status: 500 },
    )
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId } = await context.params
    const access = await getRpgAccess({
      rpgId,
      userId,
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const payload = await listCharacters({
      rpgId,
      userId,
      access,
      characterRepository: prismaCharacterRepository,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar personagens.")
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId } = await context.params
    const access = await getRpgAccess({
      rpgId,
      userId,
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const character = await createCharacter({
      rpgId,
      userId,
      access,
      payload: body,
      characterRepository: prismaCharacterRepository,
      rpgTemplatesRepository: prismaRpgTemplatesRepository,
    })

    return NextResponse.json({ character }, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar personagem.")
  }
}
