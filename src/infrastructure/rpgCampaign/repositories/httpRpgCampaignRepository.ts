import { apiFetch } from "@/infrastructure/http/apiFetch"
import type {
  RpgCampaignMessageSummary,
  RpgCampaignParticipantSummary,
  RpgCampaignRoomViewModel,
  RpgCampaignSummary,
  RpgCampaignViewModel,
} from "@/application/rpgCampaign/types"

type ErrorPayload = {
  message?: string
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
  "participants" | "campaignMessages" | "actionMessages" | "directMessages"
> & {
  campaign: Omit<RpgCampaignRoomViewModel["campaign"], "startedAt"> & {
    startedAt: string | null
  }
  participants: ApiCampaignParticipantSummary[]
  campaignMessages: ApiCampaignMessageSummary[]
  actionMessages: ApiCampaignMessageSummary[]
  directMessages: ApiCampaignMessageSummary[]
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
}
