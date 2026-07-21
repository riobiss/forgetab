import type { FastifyReply, FastifyRequest } from "fastify"
import { createCharacter } from "@/application/characters/use-cases/createCharacter"
import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import { listCharacters } from "@/application/characters/use-cases/listCharacters"
import { loadCharactersDashboardUseCase } from "@/application/characters/dashboard/use-cases/loadCharactersDashboard"
import { characterRouteDeps, loadCharactersDashboardContext } from "./dependencies"
import {
  mapCharacterCollectionError,
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "./http"
import type { CharactersCollectionRouteParams, CharactersDashboardQuery } from "./routeTypes"

function normalizeFilterType(value?: string) {
  return value === "player" || value === "npc" || value === "monster" ? value : "all"
}

export async function getCharactersDashboardHandler(
  request: FastifyRequest<{
    Params: CharactersCollectionRouteParams
    Querystring: CharactersDashboardQuery
  }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  const userId = auth.ok ? auth.userId : null
  const filterType = normalizeFilterType(request.query.type)

  try {
    const { editorBootstrap, selectedCharacterDetail } = await loadCharactersDashboardContext({
      rpgId: request.params.rpgId,
      userId,
      filterType,
      modal: request.query.modal,
      viewer: request.query.viewer,
      characterId: request.query.characterId,
    })

    const result = await loadCharactersDashboardUseCase(
      {
        dashboardRepository: characterRouteDeps.charactersDashboardRepository,
        rpgAccessRepository: characterRouteDeps.rpgAccessRepository,
      },
      {
        rpgId: request.params.rpgId,
        userId,
        filterType,
        editorBootstrap,
        selectedCharacterDetail,
      },
    )

    if (result.status === "not_found" || result.status === "private_blocked") {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    return writeJson(reply, 200, result.data)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar dashboard de personagens.")
  }
}

export async function listCharactersHandler(
  request: FastifyRequest<{ Params: CharactersCollectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      repository: characterRouteDeps.rpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    const payload = await listCharacters({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      access,
      characterRepository: characterRouteDeps.characterRepository,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return mapCharacterCollectionError(reply, error, "Erro interno ao listar personagens.")
  }
}

export async function createCharacterHandler(
  request: FastifyRequest<{ Params: CharactersCollectionRouteParams }>,
  reply: FastifyReply,
) {
  const auth = await requireUserId(request, reply)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      repository: characterRouteDeps.rpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return writeJson(reply, 404, { message: "RPG nao encontrado." })
    }

    const body = parseJsonBody(request.body)
    const character = await createCharacter({
      rpgId: request.params.rpgId,
      userId: auth.userId,
      access,
      payload: body,
      characterRepository: characterRouteDeps.characterRepository,
      rpgTemplatesRepository: characterRouteDeps.rpgTemplatesRepository,
    })

    return writeJson(reply, 201, { character })
  } catch (error) {
    return mapCharacterCollectionError(reply, error, "Erro interno ao criar personagem.")
  }
}
