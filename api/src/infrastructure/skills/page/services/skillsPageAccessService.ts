import type { SkillsPageAccessService } from "@/application/skills/page/ports/SkillsPageAccessService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const skillsPageAccessService: SkillsPageAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },
}
