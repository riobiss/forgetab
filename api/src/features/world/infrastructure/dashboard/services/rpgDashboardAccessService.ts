import type { RpgDashboardAccessService } from "@/features/world/application/dashboard/ports/RpgDashboardAccessService"
import {
  getRpgMembershipStatusByPrisma,
  getRpgPermissionByPrisma
} from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgDashboardAccessService: RpgDashboardAccessService = {
  getPermission(rpgId, userId) {
    return getRpgPermissionByPrisma(rpgId, userId)
  },

  getMembershipStatus(rpgId, userId) {
    return getRpgMembershipStatusByPrisma(rpgId, userId)
  }
}
