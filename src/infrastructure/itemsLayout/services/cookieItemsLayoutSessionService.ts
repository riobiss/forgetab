import type { ItemsLayoutSessionService } from "@/application/itemsLayout/ports/ItemsLayoutSessionService"
import { getUserIdFromCookieStore } from "@/lib/server/auth"

export const cookieItemsLayoutSessionService: ItemsLayoutSessionService = {
  getCurrentUserId() {
    return getUserIdFromCookieStore()
  },
}
