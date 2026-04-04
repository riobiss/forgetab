import {
  expelMemberUseCase,
  getCharacterRequestsUseCase,
  listRpgMembersUseCase,
  processCharacterRequestUseCase,
  processMemberActionUseCase,
  requestCharacterCreationUseCase,
  requestJoinRpgUseCase,
} from "@/application/rpgMembership/use-cases/rpgMembership"
import { prismaRpgMembershipRepository } from "@/infrastructure/rpgMembership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/infrastructure/rpgMembership/services/rpgMembershipAccessService"
import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

type RpgRouteParams = { rpgId: string }
type MemberRouteParams = { rpgId: string; memberId: string }
type CharacterRequestRouteParams = { rpgId: string; requestId: string }

async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}

export async function listRpgMembersHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await listRpgMembersUseCase(prismaRpgMembershipRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao listar membros.")
  }
}

export async function requestJoinRpgHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await requestJoinRpgUseCase(prismaRpgMembershipRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
    })

    return jsonResponse({ message: payload.message }, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao solicitar participacao.")
  }
}

export async function processMemberActionHandler(request: Request, params: MemberRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { action?: "accept" | "reject" | "toggleModerator" }
    if (!body.action || !["accept", "reject", "toggleModerator"].includes(body.action)) {
      return jsonResponse({ message: "Acao invalida." }, { status: 400 })
    }

    const payload = await processMemberActionUseCase(
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
      {
        rpgId: params.rpgId,
        userId: auth.userId,
        memberId: params.memberId,
        action: body.action,
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao processar solicitacao.")
  }
}

export async function expelMemberHandler(request: Request, params: MemberRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await expelMemberUseCase(rpgMembershipAccessService, prismaRpgMembershipRepository, {
      rpgId: params.rpgId,
      userId: auth.userId,
      memberId: params.memberId,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao expulsar membro.")
  }
}

export async function getCharacterRequestsHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await getCharacterRequestsUseCase(
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
      { rpgId: params.rpgId, userId: auth.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao consultar solicitacoes de personagem.")
  }
}

export async function requestCharacterCreationHandler(request: Request, params: RpgRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const payload = await requestCharacterCreationUseCase(
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
      { rpgId: params.rpgId, userId: auth.userId },
    )

    return jsonResponse({ message: payload.message }, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao solicitar criacao de personagem.")
  }
}

export async function processCharacterRequestHandler(
  request: Request,
  params: CharacterRequestRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) return auth.response

    const body = (await request.json()) as { action?: "accept" | "reject" }
    if (!body.action || !["accept", "reject"].includes(body.action)) {
      return jsonResponse({ message: "Acao invalida." }, { status: 400 })
    }

    const payload = await processCharacterRequestUseCase(
      rpgMembershipAccessService,
      prismaRpgMembershipRepository,
      {
        rpgId: params.rpgId,
        userId: auth.userId,
        requestId: params.requestId,
        action: body.action,
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao processar solicitacao de personagem.")
  }
}
