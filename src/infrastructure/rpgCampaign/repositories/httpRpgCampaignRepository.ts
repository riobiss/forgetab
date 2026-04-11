import { apiFetch } from "@/infrastructure/http/apiFetch"
import type {
  RpgCampaignCombatParticipantSummary,
  RpgCampaignCombatRoomSummary,
  RpgCampaignMessageSummary,
  RpgCampaignParticipantSummary,
  RpgCampaignRoomViewModel,
  RpgCampaignSummary,
  RpgCampaignViewModel,
} from "@/application/rpgCampaign/types"

type ErrorPayload = {
  message?: string
}

export type CampaignCreatureOption = {
  id: string
  name: string
  characterType: "player" | "npc" | "monster"
  progressionCurrent?: number
  statuses?: unknown
  attributes?: unknown
  skills?: unknown
}

export type CampaignItemOption = {
  id: string
  name: string
  rarity: string
}

type ApiCampaignSummary = Omit<RpgCampaignSummary, "startedAt" | "createdAt"> & {
  startedAt: string | null
  createdAt: string
}

type ApiCampaignParticipantSummary = Omit<RpgCampaignParticipantSummary, "joinedAt"> & {
  joinedAt: string
}

type ApiCampaignMessageSummary = Omit<RpgCampaignMessageSummary, "createdAt"> & {
  createdAt: string
}

type ApiCampaignCombatParticipantSummary = Omit<RpgCampaignCombatParticipantSummary, "joinedAt"> & {
  joinedAt: string
}

type ApiCampaignCombatRoomSummary = Omit<
  RpgCampaignCombatRoomSummary,
  "createdAt" | "participants"
> & {
  createdAt: string
  participants: ApiCampaignCombatParticipantSummary[]
}

type ApiCampaignViewModel = Omit<
  RpgCampaignViewModel,
  "campaigns" | "activeParticipants" | "activeMessages"
> & {
  campaigns: ApiCampaignSummary[]
  activeParticipants: ApiCampaignParticipantSummary[]
  activeMessages: ApiCampaignMessageSummary[]
}

type ApiCampaignRoomViewModel = Omit<
  RpgCampaignRoomViewModel,
  "participants" | "campaignMessages" | "actionMessages" | "directMessages" | "combatRooms"
> & {
  campaign: Omit<RpgCampaignRoomViewModel["campaign"], "startedAt"> & {
    startedAt: string | null
  }
  participants: ApiCampaignParticipantSummary[]
  campaignMessages: ApiCampaignMessageSummary[]
  actionMessages: ApiCampaignMessageSummary[]
  directMessages: ApiCampaignMessageSummary[]
  combatRooms: ApiCampaignCombatRoomSummary[]
}

export class HttpApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpApiError"
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    throw new HttpApiError(
      text.includes("<html")
        ? "A API respondeu com HTML. Verifique se a URL interna da API esta apontando para o backend, nao para o Next."
        : text || "Resposta invalida da API.",
      response.status,
    )
  }

  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpApiError(payload.message ?? "Erro ao carregar campanhas.", response.status)
  }
  return payload
}

function toCampaignSummary(item: ApiCampaignSummary): RpgCampaignSummary {
  return {
    ...item,
    startedAt: item.startedAt ? new Date(item.startedAt) : null,
    createdAt: new Date(item.createdAt),
  }
}

function toCampaignParticipant(item: ApiCampaignParticipantSummary): RpgCampaignParticipantSummary {
  return {
    ...item,
    joinedAt: new Date(item.joinedAt),
  }
}

function toCampaignMessage(item: ApiCampaignMessageSummary): RpgCampaignMessageSummary {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
  }
}

function toCampaignCombatParticipant(
  item: ApiCampaignCombatParticipantSummary,
): RpgCampaignCombatParticipantSummary {
  return {
    ...item,
    joinedAt: new Date(item.joinedAt),
  }
}

function toCampaignCombatRoom(item: ApiCampaignCombatRoomSummary): RpgCampaignCombatRoomSummary {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    participants: item.participants.map(toCampaignCombatParticipant),
  }
}

export async function fetchRpgCampaignViewModel(rpgId: string): Promise<RpgCampaignViewModel> {
  const response = await apiFetch(`/api/rpg/${rpgId}/campaigns`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })
  const payload = await parseJsonResponse<ApiCampaignViewModel>(response)

  return {
    ...payload,
    campaigns: payload.campaigns.map(toCampaignSummary),
    activeParticipants: payload.activeParticipants.map(toCampaignParticipant),
    activeMessages: payload.activeMessages.map(toCampaignMessage),
  }
}

export async function fetchRpgCampaignRoomViewModel(
  rpgId: string,
  campaignId: string,
): Promise<RpgCampaignRoomViewModel> {
  const response = await apiFetch(`/api/rpg/${rpgId}/campaigns/${campaignId}/room`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })
  const payload = await parseJsonResponse<ApiCampaignRoomViewModel>(response)

  return {
    ...payload,
    campaign: {
      ...payload.campaign,
      startedAt: payload.campaign.startedAt ? new Date(payload.campaign.startedAt) : null,
    },
    participants: payload.participants.map(toCampaignParticipant),
    campaignMessages: payload.campaignMessages.map(toCampaignMessage),
    actionMessages: payload.actionMessages.map(toCampaignMessage),
    directMessages: payload.directMessages.map(toCampaignMessage),
    combatRooms: (payload.combatRooms ?? []).map(toCampaignCombatRoom),
  }
}

async function postWithoutPayload(path: string) {
  const response = await apiFetch(path, { method: "POST" })
  return parseJsonResponse<{ message?: string }>(response)
}

async function postWithJson(path: string, body: unknown) {
  const response = await apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const payload = await parseJsonResponse<{ message?: string; chatMessage?: ApiCampaignMessageSummary }>(response)
  return {
    ...payload,
    chatMessage: payload.chatMessage ? toCampaignMessage(payload.chatMessage) : undefined,
  }
}

export const httpRpgCampaignRepository = {
  fetchViewModel: fetchRpgCampaignViewModel,
  fetchRoomViewModel: fetchRpgCampaignRoomViewModel,
  createCampaign(rpgId: string, payload: { title: string; description: string }) {
    return postWithJson(`/api/rpg/${rpgId}/campaigns`, payload)
  },
  startCampaign(rpgId: string, campaignId: string) {
    return postWithoutPayload(`/api/rpg/${rpgId}/campaigns/${campaignId}/start`)
  },
  endCampaign(rpgId: string, campaignId: string) {
    return postWithoutPayload(`/api/rpg/${rpgId}/campaigns/${campaignId}/end`)
  },
  deleteCampaign(rpgId: string, campaignId: string) {
    return apiFetch(`/api/rpg/${rpgId}/campaigns/${campaignId}`, {
      method: "DELETE",
    }).then((response) => parseJsonResponse<{ message?: string }>(response))
  },
  joinCampaign(rpgId: string, campaignId: string) {
    return postWithoutPayload(`/api/rpg/${rpgId}/campaigns/${campaignId}/join`)
  },
  leaveCampaign(rpgId: string, campaignId: string) {
    return postWithoutPayload(`/api/rpg/${rpgId}/campaigns/${campaignId}/leave`)
  },
  sendMessage(
    rpgId: string,
    campaignId: string,
    payload: { content: string; kind?: "campaign" | "direct" | "action"; recipientUserId?: string | null },
  ) {
    return postWithJson(`/api/rpg/${rpgId}/campaigns/${campaignId}/messages`, payload)
  },
  rollDice(
    rpgId: string,
    campaignId: string,
    payload: { entries: Array<{ diceCount: number; diceSides: number }> },
  ) {
    return apiFetch(`/api/rpg/${rpgId}/campaigns/${campaignId}/dice-roll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((response) => parseJsonResponse<{
      provider?: "local" | "random-org"
      groups: Array<{
        diceCount: number
        diceSides: number
        results: number[]
        total: number
      }>
    }>(response))
  },
  revokeActionMessage(rpgId: string, campaignId: string, messageId: string) {
    return apiFetch(`/api/rpg/${rpgId}/campaigns/${campaignId}/messages/${messageId}`, {
      method: "DELETE",
    }).then((response) => parseJsonResponse<{ message?: string }>(response))
  },
  acceptDeliveryOffer(
    rpgId: string,
    campaignId: string,
    messageId: string,
    payload: { characterId: string; offerId: string },
  ) {
    return postWithJson(
      `/api/rpg/${rpgId}/campaigns/${campaignId}/messages/${messageId}/accept-delivery`,
      payload,
    )
  },
  createCombat(rpgId: string, campaignId: string, payload: { name: string }) {
    return apiFetch(`/api/rpg/${rpgId}/campaigns/${campaignId}/combats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((response) => parseJsonResponse<{ message?: string; combatId?: string }>(response))
  },
  joinCombat(
    rpgId: string,
    campaignId: string,
    combatId: string,
    payload: { role: "spectator" | "fighter"; characterId?: string | null },
  ) {
    return postWithJson(`/api/rpg/${rpgId}/campaigns/${campaignId}/combats/${combatId}/join`, payload)
  },
  createCombatQueue(rpgId: string, campaignId: string, combatId: string) {
    return postWithoutPayload(`/api/rpg/${rpgId}/campaigns/${campaignId}/combats/${combatId}/queue`)
  },
  moveCombatQueueEntry(
    rpgId: string,
    campaignId: string,
    combatId: string,
    entryId: string,
    direction: -1 | 1,
  ) {
    return apiFetch(`/api/rpg/${rpgId}/campaigns/${campaignId}/combats/${combatId}/queue/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    }).then((response) => parseJsonResponse<{ message?: string }>(response))
  },
  passCombatTurn(rpgId: string, campaignId: string, combatId: string) {
    return postWithoutPayload(`/api/rpg/${rpgId}/campaigns/${campaignId}/combats/${combatId}/pass`)
  },
  async fetchCombatCreatureOptions(rpgId: string) {
    const response = await apiFetch(`/api/rpg/${rpgId}/characters`, {
      next: { revalidate: 0 },
      cache: "no-store",
    })
    const payload = await parseJsonResponse<{ characters?: CampaignCreatureOption[] }>(response)
    return (payload.characters ?? []).filter((character) => character.characterType === "monster")
  },
  async fetchCombatItemOptions(rpgId: string) {
    const response = await apiFetch(`/api/rpg/${rpgId}/items`, {
      next: { revalidate: 0 },
      cache: "no-store",
    })
    const payload = await parseJsonResponse<{ items?: CampaignItemOption[] }>(response)
    return payload.items ?? []
  },
  addCombatCreatures(
    rpgId: string,
    campaignId: string,
    combatId: string,
    payload: {
      sourceCharacterId: string
      quantity: number
      items: unknown
      rollConfig: unknown
      statRolls: unknown
    },
  ) {
    return postWithJson(`/api/rpg/${rpgId}/campaigns/${campaignId}/combats/${combatId}/creatures`, payload)
  },
}
