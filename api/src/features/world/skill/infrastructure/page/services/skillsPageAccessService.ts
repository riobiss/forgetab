import type { SkillsPageAccessService } from "@/features/world/skill/application/page/ports/SkillsPageAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const skillsPageAccessService: SkillsPageAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },
}
