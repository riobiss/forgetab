import type { FastifyReply, FastifyRequest } from "fastify"
import {
  expelMemberUseCase,
  listRpgMembersUseCase,
  processMemberActionUseCase,
  requestJoinRpgUseCase,
} from "@/application/rpg/membership/use-cases/rpgMembership"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { rpgMembershipRouteDeps } from "./dependencies"
import type { MemberRouteParams, RpgRouteParams } from "./routeTypes"

export async function listRpgMembersHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await listRpgMembersUseCase(rpgMembershipRouteDeps.repository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao listar membros.")
  }
}

export async function requestJoinRpgHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await requestJoinRpgUseCase(rpgMembershipRouteDeps.repository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
    })

    return writeJson(reply, payload.status, { message: payload.message })
  } catch (error) {
    return writeError(reply, error, "Erro interno ao solicitar participacao.")
  }
}

export async function processMemberActionHandler(
  request: FastifyRequest<{ Params: MemberRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      action?: "accept" | "reject" | "toggleModerator"
    }
    if (!body.action || !["accept", "reject", "toggleModerator"].includes(body.action)) {
      return writeJson(reply, 400, { message: "Acao invalida." })
    }

    const payload = await processMemberActionUseCase(
      rpgMembershipRouteDeps.accessService,
      rpgMembershipRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        memberId: request.params.memberId,
        action: body.action,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao processar solicitacao.")
  }
}

export async function expelMemberHandler(
  request: FastifyRequest<{ Params: MemberRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await expelMemberUseCase(
      rpgMembershipRouteDeps.accessService,
      rpgMembershipRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        memberId: request.params.memberId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao expulsar membro.")
  }
}
