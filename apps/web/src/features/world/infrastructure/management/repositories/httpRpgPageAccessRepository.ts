import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse } from "@/features/http/infrastructure/parseApiResponse"

type RpgPageAccessResponse = {
  rpg?: {
    id: string
    title: string
    canManage?: boolean
  }
}

export class HttpPageAccessError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "HttpPageAccessError"
  }
}

export async function fetchRpgPageAccess(rpgId: string) {
  const response = await apiFetch(`/api/rpg/${rpgId}`, {
    next: { revalidate: 0 },
    cache: "no-store"
  })

  const payload = await parseApiResponse<RpgPageAccessResponse>(response, {
    fallbackMessage: "Erro ao carregar RPG.",
    errorFactory: (message, status) => new HttpPageAccessError(message, status)
  })

  if (!payload.rpg) {
    throw new HttpPageAccessError("RPG nao encontrado.", 404)
  }

  return payload.rpg
}
