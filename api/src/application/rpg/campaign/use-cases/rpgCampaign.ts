import { AppError } from "@/shared/errors/AppError"
import type { RpgCampaignAccessService } from "@/application/rpg/campaign/ports/RpgCampaignAccessService"
import type { RpgCampaignRepository } from "@/application/rpg/campaign/ports/RpgCampaignRepository"
import type { RpgCampaignRoomViewModel, RpgCampaignViewModel } from "@/application/rpg/campaign/types"

const CAMPAIGN_MESSAGE_MAX_LENGTH = 1200

function assertCampaignAccess(permission: {
  exists: boolean
  isOwner: boolean
  isAcceptedMember: boolean
}) {
  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner && !permission.isAcceptedMember) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

async function assertRoomAccess(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
) {
  const permission = await accessService.getPermission(params.rpgId, params.userId)
  assertCampaignAccess(permission)

  const campaign = await repository.getCampaignSummary(params.rpgId, params.campaignId)
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  const hasJoined = permission.isOwner
    ? true
    : await repository.hasJoinedCampaign(params.campaignId, params.userId)

  if (!permission.isOwner && !hasJoined) {
    throw new AppError("Entre na campanha para abrir a sala.", 403)
  }

  return { permission, campaign }
}

export async function listRpgCampaignsUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; userId: string },
): Promise<RpgCampaignViewModel> {
  const permission = await accessService.getPermission(params.rpgId, params.userId)
  assertCampaignAccess(permission)

  const campaigns = await repository.listCampaigns(params.rpgId, params.userId)
  const activeCampaign = campaigns.find((campaign) => campaign.isActive) ?? null
  const viewerJoinedActiveCampaign = Boolean(
    activeCampaign && (permission.isOwner || activeCampaign.hasJoined),
  )

  let activeParticipants = [] as RpgCampaignViewModel["activeParticipants"]
  let activeMessages = [] as RpgCampaignViewModel["activeMessages"]

  if (activeCampaign && viewerJoinedActiveCampaign) {
    ;[activeParticipants, activeMessages] = await Promise.all([
      repository.listCampaignParticipants(activeCampaign.id),
      repository.listCampaignMessages(activeCampaign.id),
    ])
  }

  return {
    isOwner: permission.isOwner,
    canManage: permission.canManage,
    isAcceptedMember: permission.isAcceptedMember,
    activeCampaignId: activeCampaign?.id ?? null,
    viewerJoinedActiveCampaign,
    campaigns,
    activeParticipants,
    activeMessages,
  }
}

export async function createRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; userId: string; title: string; description: string },
) {
  const permission = await accessService.getPermission(params.rpgId, params.userId)

  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode criar campanhas.", 403)
  }

  const title = params.title.trim()
  const description = params.description.trim()

  if (title.length < 3) {
    throw new AppError("Informe um titulo com pelo menos 3 caracteres.", 400)
  }

  if (description.length < 5) {
    throw new AppError("Informe uma descricao com pelo menos 5 caracteres.", 400)
  }

  await repository.createCampaign(params.rpgId, { title, description })
  return { message: "Campanha criada com sucesso." }
}

export async function startRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
) {
  const permission = await accessService.getPermission(params.rpgId, params.userId)

  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode comecar a campanha.", 403)
  }

  const campaign = await repository.getCampaignSummary(params.rpgId, params.campaignId)
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  if (campaign.isActive) {
    return { message: "Esta campanha ja esta em andamento." }
  }

  await repository.startCampaign(params.rpgId, params.campaignId)
  await repository.createCampaignMessage(
    params.campaignId,
    params.userId,
    "action",
    "O owner iniciou a campanha. A sessao esta aberta.",
  )
  return { message: "Campanha em andamento." }
}

export async function endRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
) {
  const permission = await accessService.getPermission(params.rpgId, params.userId)

  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode terminar a campanha.", 403)
  }

  const campaign = await repository.getCampaignSummary(params.rpgId, params.campaignId)
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  if (!campaign.isActive) {
    return { message: "Esta campanha ja foi encerrada." }
  }

  await repository.endCampaign(params.rpgId, params.campaignId)
  await repository.createCampaignMessage(
    params.campaignId,
    params.userId,
    "action",
    "O owner encerrou a campanha.",
  )
  return { message: "Campanha encerrada." }
}

export async function joinRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
) {
  const permission = await accessService.getPermission(params.rpgId, params.userId)
  assertCampaignAccess(permission)

  const campaign = await repository.getCampaignSummary(params.rpgId, params.campaignId)
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha ainda nao foi iniciada.", 409)
  }

  const joined = await repository.joinCampaign(params.campaignId, params.userId)
  if (joined) {
    await repository.createCampaignMessage(
      params.campaignId,
      params.userId,
      "action",
      "Entrou na sessao da campanha.",
    )
  }
  return {
    message: joined ? "Voce entrou na campanha." : "Voce ja esta participando desta campanha.",
  }
}

export async function leaveRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
) {
  const permission = await accessService.getPermission(params.rpgId, params.userId)
  assertCampaignAccess(permission)

  const campaign = await repository.getCampaignSummary(params.rpgId, params.campaignId)
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  if (permission.isOwner) {
    return { message: "Voce saiu da visualizacao da campanha." }
  }

  const leftCampaign = await repository.leaveCampaign(params.campaignId, params.userId)
  if (leftCampaign) {
    await repository.createCampaignMessage(
      params.campaignId,
      params.userId,
      "action",
      "Saiu da sessao da campanha.",
    )
  }

  return {
    message: leftCampaign ? "Voce saiu da campanha." : "Voce ja nao estava participando desta campanha.",
  }
}

export async function getRpgCampaignRoomUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
): Promise<RpgCampaignRoomViewModel> {
  const { permission, campaign } = await assertRoomAccess(accessService, repository, params)

  const [participants, allMessages, directMessages] = await Promise.all([
    repository.listCampaignParticipants(params.campaignId),
    repository.listCampaignMessages(params.campaignId),
    repository.listDirectMessagesForUser(params.campaignId, params.userId),
  ])

  return {
    viewerUserId: params.userId,
    campaign,
    isOwner: permission.isOwner,
    canManage: permission.canManage,
    participants,
    campaignMessages: allMessages.filter((message) => message.kind === "campaign"),
    actionMessages: allMessages.filter((message) => message.kind === "action"),
    directMessages,
  }
}

export async function listRpgCampaignMessagesUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string },
) {
  const { permission, campaign } = await assertRoomAccess(accessService, repository, params)

  const canReadMessages = permission.isOwner || campaign.isActive

  return {
    messages: canReadMessages ? await repository.listCampaignMessages(params.campaignId) : [],
  }
}

export async function createRpgCampaignMessageUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    userId: string
    content: string
    kind?: "campaign" | "direct" | "action"
    recipientUserId?: string | null
  },
) {
  const { permission, campaign } = await assertRoomAccess(accessService, repository, params)

  const content = params.content.trim()
  if (content.length < 1) {
    throw new AppError("Digite uma mensagem antes de enviar.", 400)
  }

  if (content.length > CAMPAIGN_MESSAGE_MAX_LENGTH) {
    throw new AppError(
      `A mensagem pode ter no maximo ${CAMPAIGN_MESSAGE_MAX_LENGTH} caracteres.`,
      400,
    )
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const kind = params.kind ?? "campaign"

  if (kind === "direct") {
    if (!params.recipientUserId) {
      throw new AppError("Selecione um usuario para mandar mensagem direta.", 400)
    }

    if (params.recipientUserId === params.userId) {
      throw new AppError("Nao faz sentido mandar mensagem direta para voce mesmo.", 400)
    }

    const targetIsParticipant = await repository.isParticipantInCampaign(
      params.campaignId,
      params.recipientUserId,
    )

    if (!targetIsParticipant) {
      throw new AppError("O usuario selecionado nao esta na sessao.", 404)
    }
  }

  const message = await repository.createCampaignMessage(
    params.campaignId,
    params.userId,
    kind,
    content,
    kind === "direct" ? params.recipientUserId ?? null : null,
  )
  return { message: "Mensagem enviada.", chatMessage: message }
}
