export type LibraryAccess = {
  exists: boolean
  canView: boolean
  canManage: boolean
}

export interface LibraryAccessService {
  getRpgAccess(rpgId: string, userId: string): Promise<LibraryAccess>
}
