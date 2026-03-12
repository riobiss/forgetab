import type { CurrentUserSessionService } from "@/application/session/ports/CurrentUserSessionService"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

export const cookieCurrentUserSessionService: CurrentUserSessionService = {
  getCurrentUserId() {
    return getUserIdFromCookieStore()
  },
}
