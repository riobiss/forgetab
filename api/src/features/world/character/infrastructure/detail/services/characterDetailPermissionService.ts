import type { CharacterDetailPermissionService } from "@/features/world/character/application/detail/ports/CharacterDetailPermissionService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const characterDetailPermissionService: CharacterDetailPermissionService =
  {
    async getRpgPermission(rpgId: string, userId: string) {
      return getRpgPermissionByPrisma(rpgId, userId)
    },
  }
