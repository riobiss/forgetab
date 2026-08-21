import { prismaRpgCampaignRepository } from "@/features/world/campaign/infrastructure/repositories/prismaRpgCampaignRepository"
import { rpgCampaignAccessService } from "@/features/world/campaign/infrastructure/services/rpgCampaignAccessService"
import { randomOrgRandomNumberProvider } from "@/features/dices/random/infrastructure/randomOrgRandomNumberProvider"

export const rpgCampaignRouteDeps = {
  repository: prismaRpgCampaignRepository,
  accessService: rpgCampaignAccessService,
  randomNumberProvider: randomOrgRandomNumberProvider
} as const
