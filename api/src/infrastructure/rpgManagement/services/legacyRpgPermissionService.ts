import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { RpgPermissionService } from "@/application/rpg/management/ports/RpgPermissionService"

export const legacyRpgPermissionService: RpgPermissionService = {
  async getPermission(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)

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
