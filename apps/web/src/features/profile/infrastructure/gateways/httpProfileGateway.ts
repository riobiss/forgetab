import type {
  ProfileGateway,
  UpdateProfilePayload,
  UpdateRpgProfilePayload,
  UploadRpgProfileImagePayload
} from "@/features/profile/application/contracts/ProfileGateway"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import {
  ensureApiResponse,
  parseApiResponse
} from "@/features/http/infrastructure/parseApiResponse"
import { appendImageFile } from "@/features/media/infrastructure/appendImageFile"

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
  await ensureApiResponse(response, {
    fallbackMessage,
    errorFactory: (message, status) =>
      new HttpProfileGatewayError(message, status)
  })
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
    await appendImageFile(formData, "file", payload.file)

    if (payload.oldUrl) {
      formData.append("oldUrl", payload.oldUrl)
    }

    const response = await apiFetch("/api/uploads/profile-image", {
      method: "POST",
      body: formData
    })
    const responsePayload = await parseApiResponse<UploadImagePayload>(
      response,
      {
        fallbackMessage: "Erro ao enviar imagem.",
        invalidResponseMessage: "Resposta de upload invalida.",
        errorFactory: (message, status) =>
          new HttpProfileGatewayError(message, status)
      }
    )

    if (!responsePayload.url) {
      throw new HttpProfileGatewayError("Resposta de upload invalida.", 502)
    }

    return { url: responsePayload.url }
  }
}
