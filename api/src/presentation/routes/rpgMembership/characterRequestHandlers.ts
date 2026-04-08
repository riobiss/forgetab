import type { FastifyReply, FastifyRequest } from "fastify"
import {
  getCharacterRequestsUseCase,
  processCharacterRequestUseCase,
  requestCharacterCreationUseCase,
} from "@/application/rpg/membership/use-cases/rpgMembership"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { rpgMembershipRouteDeps } from "./dependencies"
import type { CharacterRequestRouteParams, RpgRouteParams } from "./routeTypes"

export async function getCharacterRequestsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getCharacterRequestsUseCase(
      rpgMembershipRouteDeps.accessService,
      rpgMembershipRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao consultar solicitacoes de personagem.")
  }
}

export async function requestCharacterCreationHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await requestCharacterCreationUseCase(
      rpgMembershipRouteDeps.accessService,
      rpgMembershipRouteDeps.repository,
      { rpgId: request.params.rpgId, userId: auth.userId },
    )

    return writeJson(reply, payload.status, { message: payload.message })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao solicitar criacao de personagem.")
  }
}

export async function processCharacterRequestHandler(
  request: FastifyRequest<{ Params: CharacterRequestRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as { action?: "accept" | "reject" }
    if (!body.action || !["accept", "reject"].includes(body.action)) {
      return writeJson(reply, 400, { message: "Acao invalida." })
    }

    const payload = await processCharacterRequestUseCase(
      rpgMembershipRouteDeps.accessService,
      rpgMembershipRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        requestId: request.params.requestId,
        action: body.action,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao processar solicitacao de personagem.")
  }
}
