import type { RpgCampaignAccessService } from "@/features/world/campaign/application/ports/RpgCampaignAccessService"
import { getRpgPermissionByPrisma } from "@/features/world/infrastructure/services/prismaRpgAccessResolver"

export const rpgCampaignAccessService: RpgCampaignAccessService = {
  async getPermission(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return {
      exists: permission.exists,
      ownerId: permission.ownerId ?? null,
      isOwner: permission.isOwner,
      isAcceptedMember: permission.isAcceptedMember,
      canManage: permission.canManage
    }
  }
}
