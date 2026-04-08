import type { LibraryAccessService } from "@/application/library/ports/LibraryAccessService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const prismaLibraryAccessService: LibraryAccessService = {
  async getRpgAccess(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)

    if (!permission.exists) {
      return {
        exists: false,
        canView: false,
        canManage: false,
      }
    }

    return {
      exists: true,
      canView: permission.isOwner || permission.isAcceptedMember,
      canManage: permission.canManage,
    }
  },
}
