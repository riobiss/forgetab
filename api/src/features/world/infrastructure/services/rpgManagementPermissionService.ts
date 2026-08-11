import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgManagementPermissionService = {
  async canManageRpg(rpgId: string, userId: string) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  }
}
