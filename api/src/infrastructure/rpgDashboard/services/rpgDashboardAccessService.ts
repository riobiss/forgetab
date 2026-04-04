import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { RpgDashboardAccessService } from "@/application/rpgDashboard/ports/RpgDashboardAccessService"

export const rpgDashboardAccessService: RpgDashboardAccessService = {
  getPermission(rpgId, userId) {
    return getRpgPermission(rpgId, userId)
  },

  getMembershipStatus(rpgId, userId) {
    return getMembershipStatus(rpgId, userId)
  },
}

