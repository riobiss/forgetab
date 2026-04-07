import type { ItemsLayoutSessionService } from "@/application/items/layout/ports/ItemsLayoutSessionService"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

export const cookieItemsLayoutSessionService: ItemsLayoutSessionService = {
  getCurrentUserId() {
    return getUserIdFromCookieStore()
  },
}
