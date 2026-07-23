export interface RpgPermissionService {
  canManageRpg(rpgId: string, userId: string): Promise<boolean>
}
