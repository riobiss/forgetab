export type EntityCatalogDetailAccessService = {
  getAccess(rpgId: string, userId: string): Promise<{
    canManage: boolean
    isAcceptedMember: boolean
  }>
}
