export interface RpgMembershipAccessService {
  getPermission(
    rpgId: string,
    userId: string,
  ): Promise<{ exists: boolean; canManage: boolean; ownerId: string | null }>
}

