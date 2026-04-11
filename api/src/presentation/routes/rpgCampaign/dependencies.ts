import { prismaRpgCampaignRepository } from "@/infrastructure/rpg/campaign/repositories/prismaRpgCampaignRepository"
import { rpgCampaignAccessService } from "@/infrastructure/rpg/campaign/services/rpgCampaignAccessService"
import { randomOrgRandomNumberProvider } from "@/infrastructure/random/randomOrgRandomNumberProvider"

export const rpgCampaignRouteDeps = {
  repository: prismaRpgCampaignRepository,
  accessService: rpgCampaignAccessService,
  randomNumberProvider: randomOrgRandomNumberProvider,
} as const
