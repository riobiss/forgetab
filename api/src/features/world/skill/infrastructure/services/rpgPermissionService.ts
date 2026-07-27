import type { RpgPermissionService } from "@/features/world/skill/application/ports/RpgPermissionService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgPermissionService: RpgPermissionService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },
}
