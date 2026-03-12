import type { EntityCatalogDetailAccessService } from "@/application/entityCatalog/ports/EntityCatalogDetailAccessService"
import { getMembershipStatus } from "@/lib/server/rpgAccess"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

export const entityCatalogDetailAccessService: EntityCatalogDetailAccessService = {
  async getRpgPermission(rpgId, userId) {
    const permission = await getRpgPermission(rpgId, userId)
    return {
      canManage: permission.canManage,
      isOwner: permission.isOwner,
      isAcceptedMember: permission.isAcceptedMember,
    }
  },

  async getMembershipStatus(rpgId, userId) {
    return (await getMembershipStatus(rpgId, userId)) ?? "none"
  },
}
