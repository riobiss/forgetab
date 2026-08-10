import type { CurrentUserSessionService } from "@/features/session/application/ports/CurrentUserSessionService"
import { SESSION_COOKIE_NAME } from "@/features/session/domain/sessionConfig"
import { joseAuthTokenVerifier } from "@/features/session/infrastructure/services/joseAuthTokenVerifier"

export async function getServerAuthToken() {
  if (typeof window !== "undefined") return null

  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()
    return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
  } catch {
    return null
  }
}

export const cookieCurrentUserSessionService: CurrentUserSessionService = {
  async getCurrentUserId() {
    const token = await getServerAuthToken()
    if (!token) return null

    try {
      const payload = await joseAuthTokenVerifier.verify(token)
      return payload.userId
    } catch {
      return null
    }
  }
}
