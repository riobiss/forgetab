import type { RpgMapAccessService } from "@/application/rpgMap/ports/RpgMapAccessService"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

export const rpgMapAccessService: RpgMapAccessService = {
  async getAccess(rpgId, userId) {
    if (!userId) {
      return {
        userId: null,
        canManage: false,
        isAcceptedMember: false,
      }
    }

    const permission = await getRpgPermission(rpgId, userId)
    if (permission.canManage) {
      return {
        userId,
        canManage: true,
        isAcceptedMember: true,
      }
    }

    const membershipStatus = await getMembershipStatus(rpgId, userId)
    return {
      userId,
      canManage: false,
      isAcceptedMember: membershipStatus === "accepted",
    }
  },
}
