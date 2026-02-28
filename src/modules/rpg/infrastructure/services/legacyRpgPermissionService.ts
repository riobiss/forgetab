import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { RpgPermissionService } from "@/modules/rpg/contracts/RpgPermissionService"

export const legacyRpgPermissionService: RpgPermissionService = {
  getPermission(rpgId, userId) {
    return getRpgPermission(rpgId, userId)
  },
}
