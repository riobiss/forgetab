import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { RpgMembershipAccessService } from "@/application/rpgMembership/ports/RpgMembershipAccessService"

export const rpgMembershipAccessService: RpgMembershipAccessService = {
  async getPermission(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)
    return {
      exists: permission.exists,
      canManage: permission.canManage,
      ownerId: permission.ownerId ?? null,
    }
  },
}

