import type { FastifyReply, FastifyRequest } from "fastify"
import {
  acceptRpgCampaignDeliveryOfferUseCase,
  addRpgCampaignCombatCreaturesUseCase,
  createRpgCampaignCombatQueueUseCase,
  createRpgCampaignCombatUseCase,
  deleteRpgCampaignActionMessageUseCase,
  createRpgCampaignMessageUseCase,
  createRpgCampaignUseCase,
  deleteRpgCampaignUseCase,
  endRpgCampaignUseCase,
  getRpgCampaignRoomUseCase,
  joinRpgCampaignUseCase,
  joinRpgCampaignCombatUseCase,
  leaveRpgCampaignUseCase,
  listRpgCampaignMessagesUseCase,
  listRpgCampaignsUseCase,
  moveRpgCampaignCombatQueueEntryUseCase,
  passRpgCampaignCombatTurnUseCase,
  rollRpgCampaignDiceUseCase,
  startRpgCampaignUseCase
} from "@/features/world/campaign/application/use-cases/rpgCampaign"
import {
  parseJsonBody,
  requireUserId,
  writeError,
  writeJson
} from "@/features/http/presentation/fastifyJson"
import { emitCampaignRoomRefresh } from "@/features/world/campaign/realtime/campaignSocketServer"
import { rpgCampaignRouteDeps } from "./dependencies"
import type {
  CampaignCombatQueueRouteParams,
  CampaignCombatRouteParams,
  CampaignMessageRouteParams,
  CampaignRouteParams,
  RpgRouteParams
} from "./routeTypes"

export async function listRpgCampaignsHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await listRpgCampaignsUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        userId: auth.userId
      }
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao carregar campanhas.")
  }
}

export async function createRpgCampaignHandler(
  request: FastifyRequest<{ Params: RpgRouteParams }>,
  reply: FastifyReply
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
        description: body.description ?? ""
      }
    )

    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar campanha.")
  }
}

export async function startRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao iniciar campanha.")
  }
}

export async function endRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao encerrar campanha.")
  }
}

export async function deleteRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await deleteRpgCampaignUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao deletar campanha.")
  }
}

export async function getRpgCampaignRoomHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        userId: auth.userId
      }
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(
      reply,
      error,
      "Erro interno ao carregar a sala da campanha."
    )
  }
}

export async function joinRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao entrar na campanha.")
  }
}

export async function leaveRpgCampaignHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao sair da campanha.")
  }
}

export async function listRpgCampaignMessagesHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        userId: auth.userId
      }
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(
      reply,
      error,
      "Erro interno ao carregar mensagens da campanha."
    )
  }
}

export async function createRpgCampaignMessageHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
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
        recipientUserId: body.recipientUserId ?? null
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(
      reply,
      error,
      "Erro interno ao enviar mensagem da campanha."
    )
  }
}

export async function rollRpgCampaignDiceHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      entries?: Array<{ diceCount?: unknown; diceSides?: unknown }>
    }

    const payload = await rollRpgCampaignDiceUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      rpgCampaignRouteDeps.randomNumberProvider,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
        entries: body.entries ?? []
      }
    )

    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao girar dados da campanha.")
  }
}

export async function deleteRpgCampaignActionMessageHandler(
  request: FastifyRequest<{ Params: CampaignMessageRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await deleteRpgCampaignActionMessageUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        messageId: request.params.messageId,
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao revogar acao da campanha.")
  }
}

export async function acceptRpgCampaignDeliveryOfferHandler(
  request: FastifyRequest<{ Params: CampaignMessageRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      characterId?: string
      offerId?: string
      revealToRoom?: boolean
    }

    const payload = await acceptRpgCampaignDeliveryOfferUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        messageId: request.params.messageId,
        userId: auth.userId,
        characterId: body.characterId ?? "",
        offerId: body.offerId ?? "",
        revealToRoom: body.revealToRoom === true
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(
      reply,
      error,
      "Erro interno ao aceitar entrega da campanha."
    )
  }
}

export async function createRpgCampaignCombatHandler(
  request: FastifyRequest<{ Params: CampaignRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      name?: string
    }

    const payload = await createRpgCampaignCombatUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        userId: auth.userId,
        name: body.name ?? ""
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar combate.")
  }
}

export async function joinRpgCampaignCombatHandler(
  request: FastifyRequest<{ Params: CampaignCombatRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      characterId?: string | null
      role?: "spectator" | "fighter"
    }

    const payload = await joinRpgCampaignCombatUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        combatId: request.params.combatId,
        userId: auth.userId,
        characterId: body.characterId ?? null,
        role: body.role ?? "spectator"
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao entrar no combate.")
  }
}

export async function addRpgCampaignCombatCreaturesHandler(
  request: FastifyRequest<{ Params: CampaignCombatRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      sourceCharacterId?: string
      quantity?: number
      items?: unknown
      rollConfig?: unknown
      statRolls?: unknown
    }

    const payload = await addRpgCampaignCombatCreaturesUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        combatId: request.params.combatId,
        userId: auth.userId,
        sourceCharacterId: body.sourceCharacterId ?? "",
        quantity: body.quantity ?? 1,
        items: body.items ?? null,
        rollConfig: body.rollConfig ?? null,
        statRolls: body.statRolls ?? null
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 201, payload)
  } catch (error) {
    return writeError(
      reply,
      error,
      "Erro interno ao adicionar criaturas ao combate."
    )
  }
}

export async function createRpgCampaignCombatQueueHandler(
  request: FastifyRequest<{ Params: CampaignCombatRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await createRpgCampaignCombatQueueUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        combatId: request.params.combatId,
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao criar fila do combate.")
  }
}

export async function moveRpgCampaignCombatQueueEntryHandler(
  request: FastifyRequest<{ Params: CampaignCombatQueueRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const body = (parseJsonBody(request.body) ?? {}) as {
      direction?: -1 | 1
    }

    const payload = await moveRpgCampaignCombatQueueEntryUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        combatId: request.params.combatId,
        entryId: request.params.entryId,
        userId: auth.userId,
        direction: body.direction ?? 1
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao mudar fila do combate.")
  }
}

export async function passRpgCampaignCombatTurnHandler(
  request: FastifyRequest<{ Params: CampaignCombatRouteParams }>,
  reply: FastifyReply
) {
  try {
    const auth = await requireUserId(request, reply)
    if (!auth.ok) return auth.response

    const payload = await passRpgCampaignCombatTurnUseCase(
      rpgCampaignRouteDeps.accessService,
      rpgCampaignRouteDeps.repository,
      {
        rpgId: request.params.rpgId,
        campaignId: request.params.campaignId,
        combatId: request.params.combatId,
        userId: auth.userId
      }
    )

    emitCampaignRoomRefresh(request.params.campaignId)
    return writeJson(reply, 200, payload)
  } catch (error) {
    return writeError(reply, error, "Erro interno ao passar turno do combate.")
  }
}
