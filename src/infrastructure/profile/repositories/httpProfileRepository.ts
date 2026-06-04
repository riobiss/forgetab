import type { ProfileReader } from "@/application/profile/ports/ProfileReader"
import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

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

export const httpProfileReader: ProfileReader = {
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
      ownedRpgs: (payload.rpgProfiles ?? []).map((rpg) => ({
        id: rpg.id,
        title: rpg.title,
        createdAt: rpg.joinedAt ? new Date(rpg.joinedAt) : null,
      })),
      memberships: [],
      rpgDisplayNames: (payload.rpgProfiles ?? []).map((rpg) => ({
        rpgId: rpg.id,
        displayName: rpg.nickname,
        profileImageUrl: rpg.profileImageUrl,
      })),
      characters: (payload.rpgProfiles ?? []).flatMap((rpg) =>
        rpg.characters.map((character) => ({
          id: character.id,
          name: character.name,
          rpgId: rpg.id,
        })),
      ),
    }
  },
}
