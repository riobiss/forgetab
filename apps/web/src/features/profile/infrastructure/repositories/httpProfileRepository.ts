import type { ProfileReader } from "@/features/profile/application/ports/ProfileReader"
import type { ProfileViewData } from "@/features/profile/application/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

type ApiProfilePayload = {
  name: string | null
  username: string | null
  email: string
  createdAt: string | null
  rpgProfiles?: Array<{
    id: string
    title: string
    nickname: string | null
    profileImageUrl: string | null
    joinedAt: string | null
    characters: Array<{
      id: string
      name: string
    }>
  }>
}

export class HttpProfileError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "HttpProfileError"
  }
}

export const httpProfileReader: ProfileReader = {
  async getProfile(): Promise<ProfileViewData> {
    const response = await apiFetch("/api/profile", {
      next: { revalidate: 0 },
      cache: "no-store"
    })
    const payload = await parseApiResponse<ApiProfilePayload>(response, {
      fallbackMessage: "Erro ao carregar perfil.",
      invalidResponseMessage: "Resposta de perfil invalida.",
      errorFactory: (message, status) => new HttpProfileError(message, status)
    })

    return {
      name: payload.name,
      username: payload.username,
      email: payload.email,
      createdAt: payload.createdAt ? new Date(payload.createdAt) : null,
      rpgProfiles: (payload.rpgProfiles ?? []).map((rpg) => ({
        id: rpg.id,
        title: rpg.title,
        nickname: rpg.nickname,
        profileImageUrl: rpg.profileImageUrl,
        joinedAt: rpg.joinedAt ? new Date(rpg.joinedAt) : null,
        characters: rpg.characters
      }))
    }
  }
}
