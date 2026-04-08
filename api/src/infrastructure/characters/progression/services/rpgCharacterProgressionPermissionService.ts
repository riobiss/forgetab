import type { CharacterProgressionPermissionService } from "@/application/characters/progression/ports/CharacterProgressionPermissionService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const rpgCharacterProgressionPermissionService: CharacterProgressionPermissionService = {
  async canManageRpg(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return permission.canManage
  },
}
