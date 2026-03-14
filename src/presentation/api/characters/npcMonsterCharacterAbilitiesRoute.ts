import { NextRequest, NextResponse } from "next/server"
import { loadCharacterAbilitiesUseCase } from "@/application/characterAbilities/use-cases/characterAbilities"
import {
  addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase,
} from "@/application/characterAbilities/use-cases/npcMonsterCharacterAbilities"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository"
import { legacyCharacterAbilitiesParserService } from "@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService"
import { npcMonsterCharacterAbilityService } from "@/infrastructure/characterAbilities/services/npcMonsterCharacterAbilityService"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const payload = await loadCharacterAbilitiesUseCase(
      {
        repository: prismaCharacterAbilitiesRepository,
        rpgAccessRepository: prismaRpgAccessRepository,
        parserService: legacyCharacterAbilitiesParserService,
      },
      { rpgId, characterId, userId },
    )

    if (!payload) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return NextResponse.json(
      {
        characterName: payload.characterName,
        abilities: payload.abilities,
      },
      { status: 200 },
    )
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar habilidades.")
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const payload = await addNpcMonsterCharacterAbilityUseCase(
      { service: npcMonsterCharacterAbilityService },
      { rpgId, characterId, userId, payload: await request.json() },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao adicionar habilidade.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const payload = await removeNpcMonsterCharacterAbilityUseCase(
      { service: npcMonsterCharacterAbilityService },
      { rpgId, characterId, userId, payload: await request.json() },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover habilidade.")
  }
}
