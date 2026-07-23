import type { ItemsLayoutSessionService } from "@/features/world/item/application/layout/ports/ItemsLayoutSessionService"
import { getAnonymousCurrentUserId } from "@/features/session/infrastructure/services/anonymousCurrentUserSession"

export const cookieItemsLayoutSessionService: ItemsLayoutSessionService = {
  getCurrentUserId() {
    return getAnonymousCurrentUserId()
  },
}
