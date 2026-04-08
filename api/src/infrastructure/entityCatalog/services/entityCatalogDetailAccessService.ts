import type { EntityCatalogDetailAccessService } from "@/application/entityCatalog/ports/EntityCatalogDetailAccessService"
import {
  getRpgMembershipStatusByPrisma,
  getRpgPermissionByPrisma,
} from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const entityCatalogDetailAccessService: EntityCatalogDetailAccessService = {
  async getRpgPermission(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return {
      canManage: permission.canManage,
      isOwner: permission.isOwner,
      isAcceptedMember: permission.isAcceptedMember,
    }
  },

  async getMembershipStatus(rpgId, userId) {
    return (await getRpgMembershipStatusByPrisma(rpgId, userId)) ?? "none"
  },
}
