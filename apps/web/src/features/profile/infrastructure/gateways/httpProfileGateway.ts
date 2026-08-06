import type {
  ProfileGateway,
  UpdateProfilePayload,
  UpdateRpgProfilePayload,
  UploadRpgProfileImagePayload
} from "@/features/profile/application/contracts/ProfileGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"

type ErrorPayload = {
  message?: string
}

type UploadImagePayload = ErrorPayload & {
  url?: string
}

export class HttpProfileGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "HttpProfileGatewayError"
  }
}

async function parseMutationResponse(
  response: Response,
  fallbackMessage: string
) {
  const payload = (await response.json().catch(() => ({}))) as ErrorPayload

  if (!response.ok) {
    throw new HttpProfileGatewayError(
      payload.message ?? fallbackMessage,
      response.status
    )
  }
}

export const httpProfileGateway: ProfileGateway = {
  async updateProfile(payload: UpdateProfilePayload) {
    const response = await apiFetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    await parseMutationResponse(response, "Erro ao atualizar perfil.")
  },

  async updateRpgProfile(rpgId: string, payload: UpdateRpgProfilePayload) {
    const response = await apiFetch(`/api/profile/rpg/${rpgId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    await parseMutationResponse(response, "Erro ao atualizar perfil do RPG.")
  },

  async uploadRpgProfileImage(payload: UploadRpgProfileImagePayload) {
    const formData = new FormData()
    formData.append("file", payload.file)

    if (payload.oldUrl) {
      formData.append("oldUrl", payload.oldUrl)
    }

    const response = await apiFetch("/api/uploads/profile-image", {
      method: "POST",
      body: formData
    })
    const responsePayload = (await response
      .json()
      .catch(() => ({}))) as UploadImagePayload

    if (!response.ok || !responsePayload.url) {
      throw new HttpProfileGatewayError(
        responsePayload.message ?? "Erro ao enviar imagem.",
        response.status
      )
    }

    return { url: responsePayload.url }
  }
}
