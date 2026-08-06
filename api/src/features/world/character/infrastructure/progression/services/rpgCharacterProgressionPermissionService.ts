import type { CharacterProgressionPermissionService } from "@/features/world/character/application/progression/ports/CharacterProgressionPermissionService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgCharacterProgressionPermissionService: CharacterProgressionPermissionService =
  {
    async canManageRpg(rpgId, userId) {
      const permission = await getRpgPermissionByPrisma(rpgId, userId)
      return permission.canManage
    }
  }
