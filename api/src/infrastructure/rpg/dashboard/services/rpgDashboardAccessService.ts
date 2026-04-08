import type { RpgDashboardAccessService } from "@/application/rpg/dashboard/ports/RpgDashboardAccessService"
import {
  getRpgMembershipStatusByPrisma,
  getRpgPermissionByPrisma,
} from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const rpgDashboardAccessService: RpgDashboardAccessService = {
  getPermission(rpgId, userId) {
    return getRpgPermissionByPrisma(rpgId, userId)
  },

  getMembershipStatus(rpgId, userId) {
    return getRpgMembershipStatusByPrisma(rpgId, userId)
  },
}
