export type RpgCampaignSummary = {
  id: string
  title: string
  description: string
  isActive: boolean
  startedAt: Date | null
  createdAt: Date
  participantsCount: number
  hasJoined: boolean
}

export type RpgCampaignParticipantSummary = {
  userId: string
  username: string
  name: string
  joinedAt: Date
}

export type RpgCampaignMessageSummary = {
  id: string
  campaignId: string
  authorId: string
  authorUsername: string
  authorName: string
  recipientUserId: string | null
  kind: "campaign" | "direct" | "action"
  content: string
  createdAt: Date
}

export type RpgCampaignViewModel = {
  isOwner: boolean
  canManage: boolean
  isAcceptedMember: boolean
  activeCampaignId: string | null
  viewerJoinedActiveCampaign: boolean
  campaigns: RpgCampaignSummary[]
  activeParticipants: RpgCampaignParticipantSummary[]
  activeMessages: RpgCampaignMessageSummary[]
}

export type RpgCampaignRoomViewModel = {
  viewerUserId: string
  campaign: {
    id: string
    title: string
    description: string
    isActive: boolean
    startedAt: Date | null
  }
  isOwner: boolean
  canManage: boolean
  participants: RpgCampaignParticipantSummary[]
  campaignMessages: RpgCampaignMessageSummary[]
  actionMessages: RpgCampaignMessageSummary[]
  directMessages: RpgCampaignMessageSummary[]
}
