import { cookies } from "next/headers"
import type { ProfileSessionService } from "@/application/profile/ports/ProfileSessionService"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

export const cookieProfileSessionService: ProfileSessionService = {
  async getAuthenticatedUser() {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value
      if (!token) {
        return null
      }

      const payload = await verifyAuthToken(token)
      return {
        userId: payload.userId,
        email: payload.email,
      }
    } catch {
      return null
    }
  },
}
