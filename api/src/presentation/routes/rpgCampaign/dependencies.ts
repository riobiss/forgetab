import { prismaRpgCampaignRepository } from "@/infrastructure/rpg/campaign/repositories/prismaRpgCampaignRepository"
import { rpgCampaignAccessService } from "@/infrastructure/rpg/campaign/services/rpgCampaignAccessService"

export const rpgCampaignRouteDeps = {
  repository: prismaRpgCampaignRepository,
  accessService: rpgCampaignAccessService,
} as const
