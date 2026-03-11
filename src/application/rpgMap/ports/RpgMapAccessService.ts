export type RpgMapAccess = {
  userId: string | null
  canManage: boolean
  isAcceptedMember: boolean
}

export interface RpgMapAccessService {
  getAccess(rpgId: string, userId: string | null): Promise<RpgMapAccess>
}
