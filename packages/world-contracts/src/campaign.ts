export type RpgCampaignSummary = {
  id: string
  title: string
  description: string
  isActive: boolean
  startedAt: Date | null
  endedAt: Date | null
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

export type RpgCampaignMessageKind = "campaign" | "direct" | "action"

export type RpgCampaignMessageSummary = {
  id: string
  campaignId: string
  authorId: string
  authorUsername: string
  authorName: string
  recipientUserId: string | null
  kind: RpgCampaignMessageKind
  content: string
  createdAt: Date
}

export type RpgCampaignCombatRole = "spectator" | "fighter"

export type RpgCampaignCombatParticipantSummary = {
  id: string
  userId: string | null
  name: string
  characterId: string | null
  characterName: string | null
  sourceCharacterId: string | null
  actorType: "player" | "creature"
  role: RpgCampaignCombatRole
  items: unknown
  rollConfig: unknown
  statRolls: unknown
  joinedAt: Date
}

export type RpgCampaignCombatQueueEntrySummary = {
  id: string
  participantId: string
  userId: string | null
  label: string
  roll: number
  position: number
}

export type RpgCampaignCombatRoomSummary = {
  id: string
  name: string
  activeTurnIndex: number
  createdAt: Date
  participants: RpgCampaignCombatParticipantSummary[]
  queue: RpgCampaignCombatQueueEntrySummary[]
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
    endedAt: Date | null
  }
  isOwner: boolean
  canManage: boolean
  participants: RpgCampaignParticipantSummary[]
  campaignMessages: RpgCampaignMessageSummary[]
  actionMessages: RpgCampaignMessageSummary[]
  directMessages: RpgCampaignMessageSummary[]
  combatRooms: RpgCampaignCombatRoomSummary[]
}
