import { getUserIdFromRequest } from "@/backend/auth/requestAuth"
import { jsonResponse } from "@/backend/http/jsonResponse"

export type SkillRouteParams = { id: string }
export type SkillLevelRouteParams = { id: string; levelId: string }

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
