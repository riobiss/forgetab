import type { RpgPermissionService } from "@/application/rpg/management/ports/RpgPermissionService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const rpgPermissionService: RpgPermissionService = {
  async getPermission(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)

    return {
      exists: permission.exists,
      ownerId: permission.ownerId,
      isOwner: permission.isOwner,
      isAcceptedMember: permission.isAcceptedMember,
      isModerator: permission.isModerator,
      canManage: permission.canManage,
    }
  },
}
