export interface RpgCampaignAccessService {
  getPermission(
    rpgId: string,
    userId: string
  ): Promise<{
    exists: boolean
    ownerId: string | null
    isOwner: boolean
    isAcceptedMember: boolean
    canManage: boolean
  }>
}
