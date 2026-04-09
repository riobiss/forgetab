import type { ProfileRepository } from "@/application/profile/ports/ProfileRepository"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

type ApiProfilePayload = {
  name: string | null
  username: string | null
  email: string
  createdAt: string | null
}

export class HttpProfileError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpProfileError"
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & ErrorPayload
  if (!response.ok) {
    throw new HttpProfileError(payload.message ?? "Erro ao carregar perfil.", response.status)
  }

  return payload
}

export const httpProfileRepository: ProfileRepository = {
  async getByUserId() {
    const response = await apiFetch("/api/profile", {
      next: { revalidate: 0 },
      cache: "no-store",
    })
    const payload = await parseJsonResponse<ApiProfilePayload>(response)

    return {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      createdAt: payload.createdAt ? new Date(payload.createdAt) : null,
    }
  },
}
