import type { RpgCampaignAccessService } from "@/application/rpg/campaign/ports/RpgCampaignAccessService"
import { getRpgPermissionByPrisma } from "@/infrastructure/rpg/services/prismaRpgAccessResolver"

export const rpgCampaignAccessService: RpgCampaignAccessService = {
  async getPermission(rpgId, userId) {
    const permission = await getRpgPermissionByPrisma(rpgId, userId)
    return {
      exists: permission.exists,
      ownerId: permission.ownerId ?? null,
      isOwner: permission.isOwner,
      isAcceptedMember: permission.isAcceptedMember,
      canManage: permission.canManage,
    }
  },
}
