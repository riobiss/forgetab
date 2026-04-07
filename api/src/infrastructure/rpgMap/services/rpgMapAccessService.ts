import type { RpgMapAccessService } from "@/application/rpg/map/ports/RpgMapAccessService"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

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

    const permission = await getRpgPermission(rpgId, userId)
    if (permission.canManage) {
      return {
        exists: true,
        userId,
        canManage: true,
        isAcceptedMember: true,
      }
    }

    const membershipStatus = await getMembershipStatus(rpgId, userId)
    return {
      exists: permission.exists,
      userId,
      canManage: false,
      isAcceptedMember: membershipStatus === "accepted",
    }
  },
}
