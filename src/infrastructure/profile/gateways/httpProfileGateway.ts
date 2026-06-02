import type {
  ProfileGateway,
  UpdateProfilePayload,
  UpdateRpgProfilePayload,
} from "@/application/profile/contracts/ProfileGateway"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

export class HttpProfileGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpProfileGatewayError"
  }
}

async function parseMutationResponse(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => ({}))) as ErrorPayload

  if (!response.ok) {
    throw new HttpProfileGatewayError(payload.message ?? fallbackMessage, response.status)
  }
}

export const httpProfileGateway: ProfileGateway = {
  async updateProfile(payload: UpdateProfilePayload) {
    const response = await apiFetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    await parseMutationResponse(response, "Erro ao atualizar perfil.")
  },

  async updateRpgProfile(rpgId: string, payload: UpdateRpgProfilePayload) {
    const response = await apiFetch(`/api/profile/rpg/${rpgId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    await parseMutationResponse(response, "Erro ao atualizar apelido.")
  },
}
