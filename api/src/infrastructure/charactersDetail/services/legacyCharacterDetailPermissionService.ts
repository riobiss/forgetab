import type { CharacterDetailPermissionService } from "@/application/characters/detail/ports/CharacterDetailPermissionService"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

export const legacyCharacterDetailPermissionService: CharacterDetailPermissionService = {
  async getRpgPermission(rpgId: string, userId: string) {
    return getRpgPermission(rpgId, userId)
  },
}

