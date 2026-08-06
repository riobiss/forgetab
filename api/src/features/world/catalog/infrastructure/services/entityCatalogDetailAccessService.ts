import type { EntityCatalogDetailAccessService } from "@/features/world/catalog/application/ports/EntityCatalogDetailAccessService"
import {
  getRpgMembershipStatusByPrisma,
  getRpgPermissionByPrisma
} from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const entityCatalogDetailAccessService: EntityCatalogDetailAccessService =
  {
    async getAccess(rpgId, userId) {
      const permission = await getRpgPermissionByPrisma(rpgId, userId)
      const isAcceptedMember =
        permission.isAcceptedMember ||
        (await getRpgMembershipStatusByPrisma(rpgId, userId)) === "accepted"

      return {
        canManage: permission.canManage,
        isAcceptedMember
      }
    }
  }
