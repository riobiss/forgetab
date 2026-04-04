export type EntityCatalogDetailAccessService = {
  getRpgPermission(rpgId: string, userId: string): Promise<{
    canManage: boolean
    isOwner: boolean
    isAcceptedMember: boolean
  }>
  getMembershipStatus(rpgId: string, userId: string): Promise<"accepted" | "pending" | "rejected" | "none">
}
