export interface CharacterProgressionPermissionService {
  canManageRpg(rpgId: string, userId: string): Promise<boolean>
}
