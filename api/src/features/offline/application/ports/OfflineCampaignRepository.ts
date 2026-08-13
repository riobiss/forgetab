export type OfflineCampaignSource = {
  id: string
  title: string
  description: string
  image: string | null
  characters: Array<{ id: string }>
}

export interface OfflineCampaignRepository {
  listAvailableForUser(userId: string): Promise<OfflineCampaignSource[]>
}
