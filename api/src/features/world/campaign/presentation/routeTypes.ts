export type RpgRouteParams = {
  rpgId: string
}

export type CampaignRouteParams = {
  rpgId: string
  campaignId: string
}

export type CampaignMessageRouteParams = CampaignRouteParams & {
  messageId: string
}

export type CampaignCombatRouteParams = CampaignRouteParams & {
  combatId: string
}

export type CampaignCombatQueueRouteParams = CampaignCombatRouteParams & {
  entryId: string
}
