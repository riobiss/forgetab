import type { RpgPermissionService } from "@/application/items/ports/RpgPermissionService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const rpgPermissionService: RpgPermissionService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },
}
