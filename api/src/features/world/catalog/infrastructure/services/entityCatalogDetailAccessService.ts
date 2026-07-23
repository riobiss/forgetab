import type { EntityCatalogDetailAccessService } from "@/features/world/catalog/application/ports/EntityCatalogDetailAccessService"
import {
  getRpgMembershipStatusByPrisma,
  getRpgPermissionByPrisma,
} from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const entityCatalogDetailAccessService: EntityCatalogDetailAccessService =
  {
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
