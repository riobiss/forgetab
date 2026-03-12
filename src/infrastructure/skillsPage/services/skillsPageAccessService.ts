import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { SkillsPageAccessService } from "@/application/skillsPage/ports/SkillsPageAccessService"

export const skillsPageAccessService: SkillsPageAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)
    return permission.canManage
  },
}
