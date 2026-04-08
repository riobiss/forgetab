import type { CharacterDetailPermissionService } from "@/application/characters/detail/ports/CharacterDetailPermissionService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const characterDetailPermissionService: CharacterDetailPermissionService = {
  async getRpgPermission(rpgId: string, userId: string) {
    return getRpgPermissionByPrisma(rpgId, userId)
  },
}
