import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server/auth"
import {
  charactersService,
  CreateCharacterError,
  ListCharactersError,
} from "@/lib/server/characters"
import type {
  CreateCharacterPayload,
  RouteContext,
} from "@/lib/server/characters/types"

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await charactersService.getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const result = await charactersService.listCharacters(rpgId, userId, access)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof ListCharactersError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { message: "Erro interno ao listar personagens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await charactersService.getRpgAccess(rpgId, userId)
    if (!access.exists || !access.canAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const payload = (await request.json()) as CreateCharacterPayload
    const character = await charactersService.createCharacter(
      rpgId,
      userId,
      access,
      payload,
    )

    return NextResponse.json({ character }, { status: 201 })
  } catch (error) {
    if (error instanceof CreateCharacterError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }
    if (
      error instanceof Error &&
      error.message.includes('column "use_inventory_weight_limit" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      error.message.includes('column "allow_multiple_player_characters" does not exist')
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }
    if (
      error instanceof Error &&
      (error.message.includes('column "progression_mode" does not exist') ||
        error.message.includes('column "progression_tiers" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao criar personagem." },
      { status: 500 },
    )
  }
}
