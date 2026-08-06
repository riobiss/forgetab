import type {
  AcceptedMemberSummary,
  PendingCharacterOfferSummary,
  PendingRequestSummary,
  RpgDashboardViewModel,
  SpectatorCharacterSummary,
  SpectatorStatusItem
} from "@forgetab/world-contracts/dashboard"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { createApiResponseParser } from "@/features/http/infrastructure/parseApiResponse"

type DateString = string

type ApiPendingRequestSummary = Omit<PendingRequestSummary, "requestedAt"> & {
  requestedAt: DateString
}

type ApiPendingCharacterOfferSummary = Omit<
  PendingCharacterOfferSummary,
  "requestedAt"
> & {
  requestedAt: DateString
}

type ApiSpectatorStatusItem = SpectatorStatusItem

type ApiSpectatorCharacterSummary = Omit<
  SpectatorCharacterSummary,
  "statusItems"
> & {
  statusItems: ApiSpectatorStatusItem[]
}

type ApiRpgDashboardViewModel = Omit<
  RpgDashboardViewModel,
  | "pendingRequests"
  | "pendingCharacterRequests"
  | "pendingCharacterOffers"
  | "acceptedMembers"
  | "spectatorCharacters"
> & {
  rpg: Omit<RpgDashboardViewModel["rpg"], "createdAt"> & {
    createdAt: DateString
  }
  pendingRequests: ApiPendingRequestSummary[]
  pendingCharacterRequests: ApiPendingRequestSummary[]
  pendingCharacterOffers: ApiPendingCharacterOfferSummary[]
  acceptedMembers: AcceptedMemberSummary[]
  spectatorCharacters: ApiSpectatorCharacterSummary[]
}

export class HttpApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "HttpApiError"
  }
}

const parseJsonResponse = createApiResponseParser({
  fallbackMessage: "Erro ao carregar dashboard do RPG.",
  errorFactory: (message, status) => new HttpApiError(message, status)
})

function toPendingRequestSummary(
  item: ApiPendingRequestSummary
): PendingRequestSummary {
  return {
    ...item,
    requestedAt: new Date(item.requestedAt)
  }
}

function toPendingCharacterOfferSummary(
  item: ApiPendingCharacterOfferSummary
): PendingCharacterOfferSummary {
  return {
    ...item,
    requestedAt: new Date(item.requestedAt)
  }
}

export async function fetchRpgDashboardViewModel(
  rpgId: string
): Promise<RpgDashboardViewModel> {
  const response = await apiFetch(`/api/rpg/${rpgId}/dashboard`, {
    next: { revalidate: 0 },
    cache: "no-store"
  })
  const payload = await parseJsonResponse<ApiRpgDashboardViewModel>(response)

  return {
    ...payload,
    rpg: {
      ...payload.rpg,
      createdAt: new Date(payload.rpg.createdAt)
    },
    pendingRequests: payload.pendingRequests.map(toPendingRequestSummary),
    pendingCharacterRequests: payload.pendingCharacterRequests.map(
      toPendingRequestSummary
    ),
    pendingCharacterOffers: payload.pendingCharacterOffers.map(
      toPendingCharacterOfferSummary
    ),
    acceptedMembers: payload.acceptedMembers,
    spectatorCharacters: payload.spectatorCharacters
  }
}
