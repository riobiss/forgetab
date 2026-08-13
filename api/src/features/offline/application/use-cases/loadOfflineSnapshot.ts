import type { OfflineSnapshotDto } from "@forgetab/world-contracts/offline"
import type { OfflineCampaignRepository } from "../ports/OfflineCampaignRepository"
import type { OfflineCharacterReader } from "../ports/OfflineCharacterReader"

type Dependencies = {
  campaignRepository: OfflineCampaignRepository
  characterReader: OfflineCharacterReader
  now?: () => Date
}

export async function loadOfflineSnapshotUseCase(
  deps: Dependencies,
  params: { userId: string }
): Promise<OfflineSnapshotDto> {
  const campaigns = await deps.campaignRepository.listAvailableForUser(
    params.userId
  )

  const campaignSnapshots = await Promise.all(
    campaigns.map(async (campaign) => {
      const characters = await Promise.all(
        campaign.characters.map((character) =>
          deps.characterReader.read({
            rpgId: campaign.id,
            characterId: character.id,
            userId: params.userId
          })
        )
      )

      return {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        image: campaign.image,
        characters: characters.filter((character) => character !== null)
      }
    })
  )

  return {
    version: 1,
    syncedAt: (deps.now?.() ?? new Date()).toISOString(),
    campaigns: campaignSnapshots
  }
}
