import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

export type RpgRouteParams = { rpgId: string }
export type ItemRouteParams = { rpgId: string; itemId: string }

export async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}
