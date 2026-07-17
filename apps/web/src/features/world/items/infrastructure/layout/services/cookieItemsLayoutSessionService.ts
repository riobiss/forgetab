import type { ItemsLayoutSessionService } from "@/features/world/items/application/layout/ports/ItemsLayoutSessionService"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

export const cookieItemsLayoutSessionService: ItemsLayoutSessionService = {
  getCurrentUserId() {
    return getUserIdFromCookieStore()
  },
}
