import { createCharacter } from "@/application/characters/use-cases/createCharacter"
import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import { listCharacters } from "@/application/characters/use-cases/listCharacters"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"
import {
  type CharactersCollectionRouteParams,
  mapCharacterCollectionError,
  requireUserId,
} from "./shared"

export async function listCharactersHandler(request: Request, params: CharactersCollectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: params.rpgId,
      userId: auth.userId,
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return jsonResponse({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const payload = await listCharacters({
      rpgId: params.rpgId,
      userId: auth.userId,
      access,
      characterRepository: prismaCharacterRepository,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return mapCharacterCollectionError(error, "Erro interno ao listar personagens.")
  }
}

export async function createCharacterHandler(request: Request, params: CharactersCollectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: params.rpgId,
      userId: auth.userId,
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return jsonResponse({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const character = await createCharacter({
      rpgId: params.rpgId,
      userId: auth.userId,
      access,
      payload: body,
      characterRepository: prismaCharacterRepository,
      rpgTemplatesRepository: prismaRpgTemplatesRepository,
    })

    return jsonResponse({ character }, { status: 201 })
  } catch (error) {
    return mapCharacterCollectionError(error, "Erro interno ao criar personagem.")
  }
}
