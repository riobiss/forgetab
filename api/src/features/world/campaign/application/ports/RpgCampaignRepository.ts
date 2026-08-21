import type {
  RpgCampaignCombatRole,
  RpgCampaignCombatRoomSummary,
  RpgCampaignMessageSummary,
  RpgCampaignParticipantSummary,
  RpgCampaignSummary
} from "@forgetab/world-contracts"

export interface RpgCampaignRepository {
  listCampaigns(rpgId: string, userId: string): Promise<RpgCampaignSummary[]>
  getCampaignSummary(
    rpgId: string,
    campaignId: string
  ): Promise<{
    id: string
    title: string
    description: string
    isActive: boolean
    startedAt: Date | null
    endedAt: Date | null
  } | null>
  createCampaign(
    rpgId: string,
    payload: { title: string; description: string }
  ): Promise<{ id: string }>
  startCampaign(rpgId: string, campaignId: string): Promise<boolean>
  endCampaign(rpgId: string, campaignId: string): Promise<boolean>
  deleteCampaign(rpgId: string, campaignId: string): Promise<boolean>
  joinCampaign(campaignId: string, userId: string): Promise<boolean>
  leaveCampaign(campaignId: string, userId: string): Promise<boolean>
  hasJoinedCampaign(campaignId: string, userId: string): Promise<boolean>
  isParticipantInCampaign(campaignId: string, userId: string): Promise<boolean>
  listCampaignParticipants(
    campaignId: string
  ): Promise<RpgCampaignParticipantSummary[]>
  listCampaignMessages(campaignId: string): Promise<RpgCampaignMessageSummary[]>
  listDirectMessagesForUser(
    campaignId: string,
    userId: string
  ): Promise<RpgCampaignMessageSummary[]>
  listCampaignCombats(
    campaignId: string
  ): Promise<RpgCampaignCombatRoomSummary[]>
  getCampaignActionMessage(
    campaignId: string,
    messageId: string
  ): Promise<{
    id: string
    authorId: string
    authorIsOwner: boolean
    content: string
  } | null>
  createCampaignMessage(
    campaignId: string,
    userId: string,
    kind: "campaign" | "direct" | "action",
    content: string,
    recipientUserId?: string | null
  ): Promise<RpgCampaignMessageSummary>
  deleteCampaignActionMessage(params: {
    campaignId: string
    messageId: string
    userId: string
    canDeleteAny: boolean
  }): Promise<boolean>
  createCombatRoom(params: {
    campaignId: string
    userId: string
    name: string
  }): Promise<{ id: string }>
  getCombatRoom(
    campaignId: string,
    combatId: string
  ): Promise<RpgCampaignCombatRoomSummary | null>
  joinCombatRoom(params: {
    campaignId: string
    combatId: string
    userId: string
    characterId: string | null
    role: RpgCampaignCombatRole
  }): Promise<boolean>
  addCreatureCombatants(params: {
    campaignId: string
    combatId: string
    sourceCharacterId: string
    quantity: number
    items: unknown
    rollConfig: unknown
    statRolls: unknown
  }): Promise<boolean>
  createCombatQueue(campaignId: string, combatId: string): Promise<boolean>
  moveCombatQueueEntry(params: {
    campaignId: string
    combatId: string
    entryId: string
    direction: -1 | 1
  }): Promise<boolean>
  passCombatTurn(params: {
    campaignId: string
    combatId: string
    userId: string
    canPassAny: boolean
  }): Promise<boolean>
  grantDeliveryAssets(params: {
    rpgId: string
    campaignId: string
    messageId: string
    userId: string
    characterId: string
    markOfferOpened: boolean
    previousContent: string
    nextContent: string
    assets: Array<
      | { kind: "item"; id: string; quantity: number }
      | { kind: "skill"; id: string; level: number }
    >
  }): Promise<"granted" | "invalid" | "already_opened">
}
