import type { RpgMembershipAccessService } from "@/features/world/application/membership/ports/RpgMembershipAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgMembershipAccessService: RpgMembershipAccessService = {
  async getPermission(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return {
      exists: permission.exists,
      canManage: permission.canManage,
      ownerId: permission.ownerId ?? null,
    }
  },
}
