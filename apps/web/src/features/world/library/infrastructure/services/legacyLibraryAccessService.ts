import { getRpgVisibilityAccess } from "@/lib/server/rpgLibraryAccess"
import type { LibraryAccessService } from "@/features/world/library/application/ports/LibraryAccessService"

export const legacyLibraryAccessService: LibraryAccessService = {
  async getRpgAccess(rpgId, userId) {
    return getRpgVisibilityAccess(rpgId, userId)
  },
}
