import { AppError } from "@/features/shared/application/errors/AppError"
import type { RandomNumberProvider } from "@/features/dices/random/application/ports/RandomNumberProvider"
import type { RpgCampaignAccessService } from "@/features/world/campaign/application/ports/RpgCampaignAccessService"
import type { RpgCampaignRepository } from "@/features/world/campaign/application/ports/RpgCampaignRepository"
import type {
  RpgCampaignCombatRole,
  RpgCampaignRoomViewModel,
  RpgCampaignViewModel
} from "@forgetab/world-contracts"

const CAMPAIGN_TEXT_MESSAGE_MAX_LENGTH = 4000
const CAMPAIGN_ACTION_MESSAGE_MAX_LENGTH = 8000
const COMBAT_NAME_MAX_LENGTH = 80
const COMBAT_CREATURE_MAX_QUANTITY = 20
const DICE_ROLL_MAX_GROUPS = 20
const DICE_ROLL_MAX_COUNT = 100
const DICE_ROLL_MAX_SIDES = 1000
const DELIVERY_OFFER_PREFIX = "__DELIVERY_OFFER__"

type DeliveryOfferPayload = {
  type: "delivery_offer"
  offerId: string
  mode: "single" | "chest"
  assets: Array<
    | {
        kind: "item"
        id: string
        name: string
        image: string | null
        description: string | null
        quantity: number
      }
    | {
        kind: "skill"
        id: string
        name: string
        image: string | null
        description: string | null
        level: number
      }
  >
  recipientUserIds: string[]
  recipientCharacterIds: string[]
  openedByUserId?: string | null
  openedByCharacterId?: string | null
  openedAt?: string | null
  revealedByUserId?: string | null
  revealedAt?: string | null
}

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
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )
  assertCampaignAccess(permission)

  const campaign = await repository.getCampaignSummary(
    params.rpgId,
    params.campaignId
  )
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

function parseDeliveryOffer(content: string): DeliveryOfferPayload | null {
  if (!content.startsWith(DELIVERY_OFFER_PREFIX)) {
    return null
  }

  try {
    const parsed = JSON.parse(
      content.slice(DELIVERY_OFFER_PREFIX.length)
    ) as DeliveryOfferPayload
    if (
      parsed?.type !== "delivery_offer" ||
      typeof parsed.offerId !== "string" ||
      (parsed.mode !== "single" && parsed.mode !== "chest") ||
      !Array.isArray(parsed.assets) ||
      !Array.isArray(parsed.recipientUserIds) ||
      !Array.isArray(parsed.recipientCharacterIds)
    ) {
      return null
    }

    const assets = parsed.assets
      .map((asset) => {
        if (asset?.kind === "item" && typeof asset.id === "string") {
          return {
            kind: "item" as const,
            id: asset.id,
            name: typeof asset.name === "string" ? asset.name : asset.id,
            image: typeof asset.image === "string" ? asset.image : null,
            description:
              typeof asset.description === "string" ? asset.description : null,
            quantity:
              Number.isInteger(asset.quantity) && asset.quantity > 0
                ? asset.quantity
                : 1
          }
        }

        if (asset?.kind === "skill" && typeof asset.id === "string") {
          return {
            kind: "skill" as const,
            id: asset.id,
            name: typeof asset.name === "string" ? asset.name : asset.id,
            image: typeof asset.image === "string" ? asset.image : null,
            description:
              typeof asset.description === "string" ? asset.description : null,
            level:
              Number.isInteger(asset.level) && asset.level > 0 ? asset.level : 1
          }
        }

        return null
      })
      .filter((asset): asset is DeliveryOfferPayload["assets"][number] =>
        Boolean(asset)
      )

    if (assets.length === 0) {
      return null
    }

    return {
      ...parsed,
      assets,
      recipientUserIds: parsed.recipientUserIds.filter(
        (id) => typeof id === "string"
      ),
      recipientCharacterIds: parsed.recipientCharacterIds.filter(
        (id) => typeof id === "string"
      ),
      openedByUserId:
        typeof parsed.openedByUserId === "string"
          ? parsed.openedByUserId
          : null,
      openedByCharacterId:
        typeof parsed.openedByCharacterId === "string"
          ? parsed.openedByCharacterId
          : null,
      openedAt: typeof parsed.openedAt === "string" ? parsed.openedAt : null,
      revealedByUserId:
        typeof parsed.revealedByUserId === "string"
          ? parsed.revealedByUserId
          : null,
      revealedAt:
        typeof parsed.revealedAt === "string" ? parsed.revealedAt : null
    }
  } catch {
    return null
  }
}

export async function listRpgCampaignsUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; userId: string }
): Promise<RpgCampaignViewModel> {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )
  assertCampaignAccess(permission)

  const campaigns = await repository.listCampaigns(params.rpgId, params.userId)
  const activeCampaign = campaigns.find((campaign) => campaign.isActive) ?? null
  const viewerJoinedActiveCampaign = Boolean(
    activeCampaign && (permission.isOwner || activeCampaign.hasJoined)
  )

  let activeParticipants = [] as RpgCampaignViewModel["activeParticipants"]
  let activeMessages = [] as RpgCampaignViewModel["activeMessages"]

  if (activeCampaign && viewerJoinedActiveCampaign) {
    ;[activeParticipants, activeMessages] = await Promise.all([
      repository.listCampaignParticipants(activeCampaign.id),
      repository.listCampaignMessages(activeCampaign.id)
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
    activeMessages
  }
}

export async function createRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; userId: string; title: string; description: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )

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
    throw new AppError(
      "Informe uma descricao com pelo menos 5 caracteres.",
      400
    )
  }

  await repository.createCampaign(params.rpgId, { title, description })
  return { message: "Campanha criada com sucesso." }
}

export async function startRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )

  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode comecar a campanha.", 403)
  }

  const campaign = await repository.getCampaignSummary(
    params.rpgId,
    params.campaignId
  )
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
    "O owner iniciou a campanha. A sessao esta aberta."
  )
  return { message: "Campanha em andamento." }
}

export async function endRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )

  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode terminar a campanha.", 403)
  }

  const campaign = await repository.getCampaignSummary(
    params.rpgId,
    params.campaignId
  )
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
    "O owner encerrou a campanha."
  )
  return { message: "Campanha encerrada." }
}

export async function deleteRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )

  if (!permission.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode deletar campanhas.", 403)
  }

  const deleted = await repository.deleteCampaign(
    params.rpgId,
    params.campaignId
  )
  if (!deleted) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  return { message: "Campanha deletada." }
}

export async function joinRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )
  assertCampaignAccess(permission)

  const campaign = await repository.getCampaignSummary(
    params.rpgId,
    params.campaignId
  )
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha ainda nao foi iniciada.", 409)
  }

  const joined = await repository.joinCampaign(params.campaignId, params.userId)
  if (joined) {
    const participants = await repository.listCampaignParticipants(
      params.campaignId
    )
    const participantName =
      participants
        .find((participant) => participant.userId === params.userId)
        ?.name.trim() || "Alguem"

    await repository.createCampaignMessage(
      params.campaignId,
      params.userId,
      "action",
      `${participantName} entrou na sessao da campanha.`
    )
  }
  return {
    message: joined
      ? "Voce entrou na campanha."
      : "Voce ja esta participando desta campanha."
  }
}

export async function leaveRpgCampaignUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const permission = await accessService.getPermission(
    params.rpgId,
    params.userId
  )
  assertCampaignAccess(permission)

  const campaign = await repository.getCampaignSummary(
    params.rpgId,
    params.campaignId
  )
  if (!campaign) {
    throw new AppError("Campanha nao encontrada.", 404)
  }

  if (permission.isOwner) {
    return { message: "Voce saiu da visualizacao da campanha." }
  }

  const leftCampaign = await repository.leaveCampaign(
    params.campaignId,
    params.userId
  )
  if (leftCampaign) {
    await repository.createCampaignMessage(
      params.campaignId,
      params.userId,
      "action",
      "Saiu da sessao da campanha."
    )
  }

  return {
    message: leftCampaign
      ? "Voce saiu da campanha."
      : "Voce ja nao estava participando desta campanha."
  }
}

export async function getRpgCampaignRoomUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
): Promise<RpgCampaignRoomViewModel> {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  const [participants, allMessages, directMessages, combatRooms] =
    await Promise.all([
      repository.listCampaignParticipants(params.campaignId),
      repository.listCampaignMessages(params.campaignId),
      repository.listDirectMessagesForUser(params.campaignId, params.userId),
      repository.listCampaignCombats(params.campaignId)
    ])

  return {
    viewerUserId: params.userId,
    campaign,
    isOwner: permission.isOwner,
    canManage: permission.canManage,
    participants,
    campaignMessages: allMessages.filter(
      (message) => message.kind === "campaign"
    ),
    actionMessages: allMessages.filter((message) => message.kind === "action"),
    directMessages,
    combatRooms
  }
}

export async function listRpgCampaignMessagesUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  const canReadMessages = permission.isOwner || campaign.isActive

  return {
    messages: canReadMessages
      ? await repository.listCampaignMessages(params.campaignId)
      : []
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
  }
) {
  const { campaign } = await assertRoomAccess(accessService, repository, params)

  const content = params.content.trim()
  if (content.length < 1) {
    throw new AppError("Digite uma mensagem antes de enviar.", 400)
  }

  const kind = params.kind ?? "campaign"
  const messageMaxLength =
    kind === "action"
      ? CAMPAIGN_ACTION_MESSAGE_MAX_LENGTH
      : CAMPAIGN_TEXT_MESSAGE_MAX_LENGTH

  if (content.length > messageMaxLength) {
    throw new AppError(
      `A mensagem pode ter no maximo ${messageMaxLength} caracteres.`,
      400
    )
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  if (kind === "direct") {
    if (!params.recipientUserId) {
      throw new AppError(
        "Selecione um usuario para mandar mensagem direta.",
        400
      )
    }

    if (params.recipientUserId === params.userId) {
      throw new AppError(
        "Nao faz sentido mandar mensagem direta para voce mesmo.",
        400
      )
    }

    const targetIsParticipant = await repository.isParticipantInCampaign(
      params.campaignId,
      params.recipientUserId
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
    kind === "direct" ? (params.recipientUserId ?? null) : null
  )
  return { message: "Mensagem enviada.", chatMessage: message }
}

export async function rollRpgCampaignDiceUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  randomNumberProvider: RandomNumberProvider,
  params: {
    rpgId: string
    campaignId: string
    userId: string
    entries: Array<{ diceCount?: unknown; diceSides?: unknown }>
  }
) {
  const { campaign } = await assertRoomAccess(accessService, repository, params)

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  if (
    !Array.isArray(params.entries) ||
    params.entries.length < 1 ||
    params.entries.length > DICE_ROLL_MAX_GROUPS
  ) {
    throw new AppError(
      `Escolha entre 1 e ${DICE_ROLL_MAX_GROUPS} linhas de dados.`,
      400
    )
  }

  const groups = []
  let provider: "local" | "random-org" = "local"

  for (const entry of params.entries) {
    const diceCount = Number(entry.diceCount)
    const diceSides = Number(entry.diceSides)

    if (
      !Number.isInteger(diceCount) ||
      diceCount < 1 ||
      diceCount > DICE_ROLL_MAX_COUNT
    ) {
      throw new AppError(
        `Escolha entre 1 e ${DICE_ROLL_MAX_COUNT} dados por linha.`,
        400
      )
    }

    if (
      !Number.isInteger(diceSides) ||
      diceSides < 2 ||
      diceSides > DICE_ROLL_MAX_SIDES
    ) {
      throw new AppError(
        `Escolha um dado entre 2 e ${DICE_ROLL_MAX_SIDES} lados por linha.`,
        400
      )
    }

    const result = await randomNumberProvider.generateIntegers({
      count: diceCount,
      min: 1,
      max: diceSides
    })

    if (result.provider === "random-org") {
      provider = "random-org"
    }

    groups.push({
      diceCount,
      diceSides,
      results: result.numbers,
      total: result.numbers.reduce((sum, value) => sum + value, 0)
    })
  }

  return {
    provider,
    groups
  }
}

export async function deleteRpgCampaignActionMessageUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    messageId: string
    userId: string
  }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const deleted = await repository.deleteCampaignActionMessage({
    campaignId: params.campaignId,
    messageId: params.messageId,
    userId: params.userId,
    canDeleteAny: permission.isOwner
  })

  if (!deleted) {
    throw new AppError(
      permission.isOwner
        ? "Nao foi possivel encontrar essa acao para revogar."
        : "Somente as duas ultimas acoes podem ser revogadas.",
      404
    )
  }

  return { message: "Acao revogada." }
}

export async function acceptRpgCampaignDeliveryOfferUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    messageId: string
    userId: string
    characterId: string
    offerId: string
    revealToRoom?: boolean
  }
) {
  const { campaign } = await assertRoomAccess(accessService, repository, params)

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const message = await repository.getCampaignActionMessage(
    params.campaignId,
    params.messageId
  )
  if (!message) {
    throw new AppError("Entrega nao encontrada.", 404)
  }

  if (!message.authorIsOwner) {
    throw new AppError(
      "Somente entregas criadas pelo owner podem ser aceitas.",
      403
    )
  }

  const offer = parseDeliveryOffer(message.content)
  if (!offer || offer.offerId !== params.offerId) {
    throw new AppError("Entrega invalida.", 400)
  }

  if (offer.mode === "chest" && offer.openedAt) {
    throw new AppError("Este bau ja foi aberto.", 409)
  }

  const isTargeted =
    offer.recipientUserIds.length > 0 || offer.recipientCharacterIds.length > 0
  const canReceive =
    !isTargeted ||
    offer.recipientUserIds.includes(params.userId) ||
    offer.recipientCharacterIds.includes(params.characterId)

  if (!canReceive) {
    throw new AppError(
      "Essa entrega nao esta destinada ao seu personagem.",
      403
    )
  }

  const openedAt = new Date().toISOString()
  const shouldRevealToRoom =
    offer.mode === "chest" && params.revealToRoom === true
  const nextOfferContent = `${DELIVERY_OFFER_PREFIX}${JSON.stringify({
    ...offer,
    openedByUserId: params.userId,
    openedByCharacterId: params.characterId,
    openedAt,
    revealedByUserId: shouldRevealToRoom ? params.userId : null,
    revealedAt: shouldRevealToRoom ? openedAt : null
  } satisfies DeliveryOfferPayload)}`

  const granted = await repository.grantDeliveryAssets({
    rpgId: params.rpgId,
    campaignId: params.campaignId,
    messageId: params.messageId,
    userId: params.userId,
    characterId: params.characterId,
    markOfferOpened: offer.mode === "chest",
    previousContent: message.content,
    nextContent: nextOfferContent,
    assets: offer.assets
  })

  if (granted === "already_opened") {
    throw new AppError("Este bau ja foi aberto.", 409)
  }

  if (granted !== "granted") {
    throw new AppError("Personagem ou entrega invalida.", 400)
  }

  return {
    message: offer.mode === "chest" ? "Bau recebido." : "Entrega aceita."
  }
}

export async function createRpgCampaignCombatUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: { rpgId: string; campaignId: string; userId: string; name: string }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode criar combates.", 403)
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const name = params.name.trim() || "Combate"
  if (name.length > COMBAT_NAME_MAX_LENGTH) {
    throw new AppError(
      `O nome do combate pode ter no maximo ${COMBAT_NAME_MAX_LENGTH} caracteres.`,
      400
    )
  }

  const combat = await repository.createCombatRoom({
    campaignId: params.campaignId,
    userId: params.userId,
    name
  })

  return { message: "Combate criado.", combatId: combat.id }
}

export async function joinRpgCampaignCombatUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    combatId: string
    userId: string
    characterId?: string | null
    role: RpgCampaignCombatRole
  }
) {
  const { campaign } = await assertRoomAccess(accessService, repository, params)

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  if (params.role !== "spectator" && params.role !== "fighter") {
    throw new AppError("Escolha se voce vai assistir ou batalhar.", 400)
  }

  const joined = await repository.joinCombatRoom({
    campaignId: params.campaignId,
    combatId: params.combatId,
    userId: params.userId,
    characterId: params.characterId?.trim() || null,
    role: params.role
  })

  if (!joined) {
    throw new AppError("Combate nao encontrado.", 404)
  }

  return {
    message:
      params.role === "fighter"
        ? "Voce entrou para batalhar."
        : "Voce entrou para assistir."
  }
}

export async function addRpgCampaignCombatCreaturesUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    combatId: string
    userId: string
    sourceCharacterId: string
    quantity: number
    items: unknown
    rollConfig: unknown
    statRolls: unknown
  }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  if (!permission.isOwner) {
    throw new AppError(
      "Somente o owner pode adicionar criaturas ao combate.",
      403
    )
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const quantity = Math.trunc(Number(params.quantity))
  if (
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    quantity > COMBAT_CREATURE_MAX_QUANTITY
  ) {
    throw new AppError(
      `Informe uma quantidade de 1 a ${COMBAT_CREATURE_MAX_QUANTITY} criaturas.`,
      400
    )
  }

  const added = await repository.addCreatureCombatants({
    campaignId: params.campaignId,
    combatId: params.combatId,
    sourceCharacterId: params.sourceCharacterId,
    quantity,
    items: params.items,
    rollConfig: params.rollConfig,
    statRolls: params.statRolls
  })

  if (!added) {
    throw new AppError("Criatura ou combate nao encontrado.", 404)
  }

  return { message: "Criaturas adicionadas ao combate." }
}

export async function createRpgCampaignCombatQueueUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    combatId: string
    userId: string
  }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode comecar a fila.", 403)
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const created = await repository.createCombatQueue(
    params.campaignId,
    params.combatId
  )
  if (!created) {
    throw new AppError(
      "Adicione pelo menos um batalhante antes de girar a iniciativa.",
      400
    )
  }

  return { message: "Fila criada." }
}

export async function moveRpgCampaignCombatQueueEntryUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    combatId: string
    entryId: string
    userId: string
    direction: -1 | 1
  }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  if (!permission.isOwner) {
    throw new AppError("Somente o owner pode mudar a fila.", 403)
  }

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  if (params.direction !== -1 && params.direction !== 1) {
    throw new AppError("Direcao invalida para mudar a fila.", 400)
  }

  const moved = await repository.moveCombatQueueEntry({
    campaignId: params.campaignId,
    combatId: params.combatId,
    entryId: params.entryId,
    direction: params.direction
  })

  if (!moved) {
    throw new AppError("Nao foi possivel mudar essa posicao da fila.", 404)
  }

  return { message: "Fila atualizada." }
}

export async function passRpgCampaignCombatTurnUseCase(
  accessService: RpgCampaignAccessService,
  repository: RpgCampaignRepository,
  params: {
    rpgId: string
    campaignId: string
    combatId: string
    userId: string
  }
) {
  const { permission, campaign } = await assertRoomAccess(
    accessService,
    repository,
    params
  )

  if (!campaign.isActive) {
    throw new AppError("A campanha foi encerrada.", 409)
  }

  const passed = await repository.passCombatTurn({
    campaignId: params.campaignId,
    combatId: params.combatId,
    userId: params.userId,
    canPassAny: permission.isOwner
  })

  if (!passed) {
    throw new AppError(
      "Somente o jogador do turno ou o owner pode passar.",
      403
    )
  }

  return { message: "Turno passado." }
}
