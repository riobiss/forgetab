import type { CurrentUserSessionService } from "@/features/session/application/ports/CurrentUserSessionService"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

export const cookieCurrentUserSessionService: CurrentUserSessionService = {
  getCurrentUserId() {
    return getUserIdFromCookieStore()
  },
}
