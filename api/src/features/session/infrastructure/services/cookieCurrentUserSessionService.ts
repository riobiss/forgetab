import type { CurrentUserSessionService } from "@/features/session/application/ports/CurrentUserSessionService"
import { getAnonymousCurrentUserId } from "./anonymousCurrentUserSession"

export const cookieCurrentUserSessionService: CurrentUserSessionService = {
  getCurrentUserId() {
    return getAnonymousCurrentUserId()
  },
}
