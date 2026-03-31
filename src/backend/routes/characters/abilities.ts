import { loadCharacterAbilitiesUseCase } from "@/application/characterAbilities/use-cases/characterAbilities"
import {
  addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase,
} from "@/application/characterAbilities/use-cases/npcMonsterCharacterAbilities"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository"
import { legacyCharacterAbilitiesParserService } from "@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService"
import { npcMonsterCharacterAbilityService } from "@/infrastructure/characterAbilities/services/npcMonsterCharacterAbilityService"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { type CharacterInventoryRouteParams, requireUserId } from "./shared"

export async function getNpcMonsterCharacterAbilitiesHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await loadCharacterAbilitiesUseCase(
      {
        repository: prismaCharacterAbilitiesRepository,
        rpgAccessRepository: prismaRpgAccessRepository,
        parserService: legacyCharacterAbilitiesParserService,
      },
      { rpgId: params.rpgId, characterId: params.characterId, userId: auth.userId },
    )

    if (!payload) {
      return jsonResponse({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return jsonResponse(
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

export async function addNpcMonsterCharacterAbilityHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await addNpcMonsterCharacterAbilityUseCase(
      { service: npcMonsterCharacterAbilityService },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        payload: await request.json(),
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao adicionar habilidade.")
  }
}

export async function removeNpcMonsterCharacterAbilityHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await removeNpcMonsterCharacterAbilityUseCase(
      { service: npcMonsterCharacterAbilityService },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        payload: await request.json(),
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover habilidade.")
  }
}
