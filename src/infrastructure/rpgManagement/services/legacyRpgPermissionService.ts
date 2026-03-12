import { getRpgPermission } from "@/lib/server/rpgPermissions"
import type { RpgPermissionService } from "@/application/rpgManagement/ports/RpgPermissionService"

export const legacyRpgPermissionService: RpgPermissionService = {
  getPermission(rpgId, userId) {
    return getRpgPermission(rpgId, userId)
  },
}
