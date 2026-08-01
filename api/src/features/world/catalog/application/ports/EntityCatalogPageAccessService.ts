export type EntityCatalogPageAccess = {
  exists: boolean
  canRead: boolean
  canManage: boolean
}

export interface EntityCatalogPageAccessService {
  getAccess(params: {
    rpgId: string
    userId: string | null
  }): Promise<EntityCatalogPageAccess>
}
