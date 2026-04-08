import type { RpgMembershipAccessService } from "@/application/rpg/membership/ports/RpgMembershipAccessService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

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
