import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { SkillsPageAccessService } from "@/features/world/skills/application/page/ports/SkillsPageAccessService"

export const skillsPageAccessService: SkillsPageAccessService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)
    return permission.canManage
  },
}
