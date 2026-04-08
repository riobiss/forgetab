import type { CurrentUserSessionService } from "@/application/session/ports/CurrentUserSessionService"
import { getAnonymousCurrentUserId } from "./anonymousCurrentUserSession"

export const cookieCurrentUserSessionService: CurrentUserSessionService = {
  getCurrentUserId() {
    return getAnonymousCurrentUserId()
  },
}
