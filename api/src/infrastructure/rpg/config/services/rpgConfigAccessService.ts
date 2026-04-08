import type { RpgConfigAccessService } from "@/application/rpg/config/ports/RpgConfigAccessService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const rpgConfigAccessService: RpgConfigAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },

  async canReadRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.isOwner || permission.isAcceptedMember
  },
}
