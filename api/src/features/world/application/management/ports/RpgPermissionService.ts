export type RpgPermission = {
  exists: boolean
  ownerId: string | null
  isOwner: boolean
  isAcceptedMember: boolean
  isModerator: boolean
  canManage: boolean
}

export interface RpgPermissionService {
  getPermission(rpgId: string, userId: string): Promise<RpgPermission>
}
