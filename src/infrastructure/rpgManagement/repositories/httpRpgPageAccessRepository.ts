import { apiFetch } from "@/infrastructure/http/apiFetch"

type ErrorPayload = {
  message?: string
}

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
    readonly status: number,
  ) {
    super(message)
    this.name = "HttpPageAccessError"
  }
}

export async function fetchRpgPageAccess(rpgId: string) {
  const response = await apiFetch(`/api/rpg/${rpgId}`, {
    next: { revalidate: 0 },
    cache: "no-store",
  })

  const payload = (await response.json()) as RpgPageAccessResponse & ErrorPayload

  if (!response.ok) {
    throw new HttpPageAccessError(payload.message ?? "Erro ao carregar RPG.", response.status)
  }

  if (!payload.rpg) {
    throw new HttpPageAccessError("RPG nao encontrado.", 404)
  }

  return payload.rpg
}
