import type { CharacterDetailPermissionService } from "@/features/world/characters/application/detail/ports/CharacterDetailPermissionService"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

export const legacyCharacterDetailPermissionService: CharacterDetailPermissionService = {
  async getRpgPermission(rpgId: string, userId: string) {
    return getRpgPermission(rpgId, userId)
  },
}
