import type { FastifyReply, FastifyRequest } from "fastify"
import {
  expelMemberUseCase,
  getCharacterRequestsUseCase,
  listRpgMembersUseCase,
  processCharacterRequestUseCase,
  processMemberActionUseCase,
  requestCharacterCreationUseCase,
  requestJoinRpgUseCase,
} from "@/application/rpg/membership/use-cases/rpgMembership"
import { prismaRpgMembershipRepository } from "@/infrastructure/rpgMembership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/infrastructure/rpgMembership/services/rpgMembershipAccessService"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"

type RpgRouteParams = { rpgId: string }
type MemberRouteParams = { rpgId: string; memberId: string }
type CharacterRequestRouteParams = { rpgId: string; requestId: string }

export async function listRpgMembersHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await listRpgMembersUseCase(prismaRpgMembershipRepository, {
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

    const payload = await requestJoinRpgUseCase(prismaRpgMembershipRepository, {
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
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
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

    const payload = await expelMemberUseCase(rpgMembershipAccessService, prismaRpgMembershipRepository, {
      rpgId: request.params.rpgId,
      userId: auth.userId,
      memberId: request.params.memberId,
    })

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao expulsar membro.")
  }
}

export async function getCharacterRequestsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getCharacterRequestsUseCase(
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
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
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
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
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
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
