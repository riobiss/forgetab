export type RpgPermission = {
  exists: boolean
  canManage: boolean
  isOwner: boolean
  isAcceptedMember: boolean
  ownerId: string | null
}

export interface RpgPermissionService {
  getPermission(rpgId: string, userId: string): Promise<RpgPermission>
}
