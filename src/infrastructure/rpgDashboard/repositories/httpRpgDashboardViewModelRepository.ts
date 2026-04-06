import type {
  AcceptedMemberSummary,
  PendingRequestSummary,
  RpgDashboardViewModel,
  SpectatorCharacterSummary,
  SpectatorStatusItem,
} from "@/application/rpgDashboard/types"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

type DateString = string

type ApiPendingRequestSummary = Omit<PendingRequestSummary, "requestedAt"> & {
  requestedAt: DateString
}

type ApiSpectatorStatusItem = SpectatorStatusItem

type ApiSpectatorCharacterSummary = Omit<SpectatorCharacterSummary, "statusItems"> & {
  statusItems: ApiSpectatorStatusItem[]
}

type ApiRpgDashboardViewModel = Omit<
  RpgDashboardViewModel,
  "pendingRequests" | "pendingCharacterRequests" | "acceptedMembers" | "spectatorCharacters"
> & {
  rpg: Omit<RpgDashboardViewModel["rpg"], "createdAt"> & {
    createdAt: DateString
  }
  pendingRequests: ApiPendingRequestSummary[]
  pendingCharacterRequests: ApiPendingRequestSummary[]
  acceptedMembers: AcceptedMemberSummary[]
  spectatorCharacters: ApiSpectatorCharacterSummary[]
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
    throw new HttpApiError(payload.message ?? "Erro ao carregar dashboard do RPG.", response.status)
  }
  return payload
}

function toPendingRequestSummary(item: ApiPendingRequestSummary): PendingRequestSummary {
  return {
    ...item,
    requestedAt: new Date(item.requestedAt),
  }
}

export async function fetchRpgDashboardViewModel(rpgId: string): Promise<RpgDashboardViewModel> {
  const response = await apiFetch(`/api/rpg/${rpgId}/dashboard`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })
  const payload = await parseJsonResponse<ApiRpgDashboardViewModel>(response)

  return {
    ...payload,
    rpg: {
      ...payload.rpg,
      createdAt: new Date(payload.rpg.createdAt),
    },
    pendingRequests: payload.pendingRequests.map(toPendingRequestSummary),
    pendingCharacterRequests: payload.pendingCharacterRequests.map(toPendingRequestSummary),
    acceptedMembers: payload.acceptedMembers,
    spectatorCharacters: payload.spectatorCharacters,
  }
}
