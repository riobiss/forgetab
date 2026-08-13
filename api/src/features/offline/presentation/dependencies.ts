import { prismaOfflineCampaignRepository } from "@/features/offline/infrastructure/repositories/prismaOfflineCampaignRepository"
import { createExistingOfflineCharacterReader } from "@/features/offline/infrastructure/readers/existingOfflineCharacterReader"
import { characterRouteDeps } from "@/features/world/character/presentation/dependencies"

export const offlineRouteDeps = {
  campaignRepository: prismaOfflineCampaignRepository,
  characterReader: createExistingOfflineCharacterReader(characterRouteDeps)
}
