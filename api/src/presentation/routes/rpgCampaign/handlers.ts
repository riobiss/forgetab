import type { FastifyReply, FastifyRequest } from "fastify"
import {
  createRpgCampaignMessageUseCase,
  createRpgCampaignUseCase,
  endRpgCampaignUseCase,
  getRpgCampaignRoomUseCase,
  joinRpgCampaignUseCase,
  leaveRpgCampaignUseCase,
  listRpgCampaignMessagesUseCase,
  listRpgCampaignsUseCase,
  startRpgCampaignUseCase,
} from "@/application/rpg/campaign/use-cases/rpgCampaign"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson,
} from "@api/presentation/http/fastifyJson"
import { emitCampaignRoomRefresh } from "@api/realtime/campaignSocketServer"
import { rpgCampaignRouteDeps } from "./dependencies"
import type { CampaignRouteParams, RpgRouteParams } from "./routeTypes"

export async function listRpgCampaignsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await listRpgCampaignsUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar campanhas.")
  }
}

export async function createRpgCampaignHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      title?: string
      description?: string
    }

    const payload = await createRpgCampaignUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId,
        title: body.title ?? "",
        description: body.description ?? "",
      },
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar campanha.")
  }
}

export async function startRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await startRpgCampaignUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
      },
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao iniciar campanha.")
  }
}

export async function endRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await endRpgCampaignUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
      },
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao encerrar campanha.")
  }
}

export async function getRpgCampaignRoomHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await getRpgCampaignRoomUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar a sala da campanha.")
  }
}

export async function joinRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await joinRpgCampaignUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
      },
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao entrar na campanha.")
  }
}

export async function leaveRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await leaveRpgCampaignUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
      },
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao sair da campanha.")
  }
}

export async function listRpgCampaignMessagesHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await listRpgCampaignMessagesUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
      },
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar mensagens da campanha.")
  }
}

export async function createRpgCampaignMessageHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply,
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      content?: string
      kind?: "campaign" | "direct" | "action"
      recipientUserId?: string | null
    }

    const payload = await createRpgCampaignMessageUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
        content: body.content ?? "",
        kind: body.kind,
        recipientUserId: body.recipientUserId ?? null,
      },
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao enviar mensagem da campanha.")
  }
}
