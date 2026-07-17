import type { RpgPermissionService } from "@/features/world/items/application/items/ports/RpgPermissionService"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

export const rpgPermissionService: RpgPermissionService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)
    return permission.canManage
  },
}
