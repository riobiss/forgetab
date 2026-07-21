import type { FastifyReply, FastifyRequest } from "fastify"
import {
  grantCharacterPointsUseCase,
  grantCharacterXpUseCase,
} from "@/application/characters/progression/use-cases/characterProgression"
import { characterRouteDeps } from "./dependencies"
import { parseJsonBody, requireUserId, writeError, writeJson } from "./http"
import type { CharacterRouteParams } from "./routeTypes"

const characterProgressionDeps = {
  repository: characterRouteDeps.characterProgressionRepository,
  permissionService: characterRouteDeps.characterProgressionPermissionService,
}

export async function grantCharacterXpHandler(
  request: FastifyRequest<{ Params: CharacterRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = (parseJsonBody(request.body) ?? {}) as { amount?: unknown }
    const payload = await grantCharacterXpUseCase(characterProgressionDeps, {
      characterId: request.params.id,
      userId: auth.userId,
      amount: body.amount,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao conceder XP.")
  }
}

export async function grantCharacterPointsHandler(
  request: FastifyRequest<{ Params: CharacterRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) {
      return auth.response
    }

    const body = (parseJsonBody(request.body) ?? {}) as { amount?: unknown }
    const payload = await grantCharacterPointsUseCase(characterProgressionDeps, {
      characterId: request.params.id,
      userId: auth.userId,
      amount: body.amount,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao conceder pontos.")
  }
}
