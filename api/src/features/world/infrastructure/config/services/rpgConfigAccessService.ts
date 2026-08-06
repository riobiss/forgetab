import type { RpgConfigAccessService } from "@/features/world/application/config/ports/RpgConfigAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgConfigAccessService: RpgConfigAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },

  async canReadRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.isOwner || permission.isAcceptedMember
  }
}
