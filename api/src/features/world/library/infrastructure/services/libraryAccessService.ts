import type { LibraryAccessService } from "@/features/world/library/application/ports/LibraryAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const libraryAccessService: LibraryAccessService = {
  async getRpgAccess(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)

    if (!permission.exists) {
      return { exists: false, canView: false, canManage: false }
    }

    return {
      exists: true,
      canView: permission.isOwner || permission.isAcceptedMember,
      canManage: permission.canManage,
    }
  },
}
