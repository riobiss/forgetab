import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import {
  getRpgMembershipStatusByPrisma,
  getRpgPermissionByPrisma,
} from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgMapAccessService: RpgMapAccessService = {
  async getAccess(rpgId, userId) {
    if (!userId) {
      return {
        exists: false,
        userId: null,
        canManage: false,
        isAcceptedMember: false,
      }
    }

    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    if (permission.canManage) {
      return {
        exists: true,
        userId,
        canManage: true,
        isAcceptedMember: true,
      }
    }

    const membershipStatus = await getRpgMembershipStatusByPrisma(rpgId, userId)
    return {
      exists: permission.exists,
      userId,
      canManage: false,
      isAcceptedMember: membershipStatus === "accepted",
    }
  },
}
