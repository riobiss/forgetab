import type {
  RpgCampaignMessageSummary,
  RpgCampaignParticipantSummary,
  RpgCampaignSummary,
} from "@/application/rpg/campaign/types"

export interface RpgCampaignRepository {
  listCampaigns(rpgId: string, userId: string): Promise<RpgCampaignSummary[]>
  getCampaignSummary(
    rpgId: string,
    campaignId: string,
  ): Promise<{
    id: string
    title: string
    description: string
    isActive: boolean
    startedAt: Date | null
  } | null>
  createCampaign(
    rpgId: string,
    payload: { title: string; description: string },
  ): Promise<{ id: string }>
  startCampaign(rpgId: string, campaignId: string): Promise<boolean>
  endCampaign(rpgId: string, campaignId: string): Promise<boolean>
  joinCampaign(campaignId: string, userId: string): Promise<boolean>
  leaveCampaign(campaignId: string, userId: string): Promise<boolean>
  hasJoinedCampaign(campaignId: string, userId: string): Promise<boolean>
  isParticipantInCampaign(campaignId: string, userId: string): Promise<boolean>
  listCampaignParticipants(campaignId: string): Promise<RpgCampaignParticipantSummary[]>
  listCampaignMessages(campaignId: string): Promise<RpgCampaignMessageSummary[]>
  listDirectMessagesForUser(campaignId: string, userId: string): Promise<RpgCampaignMessageSummary[]>
  createCampaignMessage(
    campaignId: string,
    userId: string,
    kind: "campaign" | "direct" | "action",
    content: string,
    recipientUserId?: string | null,
  ): Promise<RpgCampaignMessageSummary>
}
