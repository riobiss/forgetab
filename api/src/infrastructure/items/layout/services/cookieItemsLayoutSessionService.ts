import type { ItemsLayoutSessionService } from "@/application/items/layout/ports/ItemsLayoutSessionService"
import { getAnonymousCurrentUserId } from "@/infrastructure/session/services/anonymousCurrentUserSession"

export const cookieItemsLayoutSessionService: ItemsLayoutSessionService = {
  getCurrentUserId() {
    return getAnonymousCurrentUserId()
  },
}
