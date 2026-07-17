import type { CharacterProgressionPermissionService } from "@/features/world/characters/application/progression/ports/CharacterProgressionPermissionService"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

export const rpgCharacterProgressionPermissionService: CharacterProgressionPermissionService =
  {
    async canManageRpg(rpgId, userId) {
      const permission = await getRpgPermission(rpgId, userId)
      return permission.canManage
    },
  }
