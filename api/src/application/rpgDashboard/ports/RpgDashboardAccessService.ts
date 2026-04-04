export interface RpgDashboardAccessService {
  getPermission(
    rpgId: string,
    userId: string,
  ): Promise<{ isOwner: boolean; canManage: boolean }>
  getMembershipStatus(
    rpgId: string,
    userId: string,
  ): Promise<"pending" | "accepted" | "rejected" | null>
}

