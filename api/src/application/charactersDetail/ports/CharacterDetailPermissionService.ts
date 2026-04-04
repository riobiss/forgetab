export interface CharacterDetailPermissionService {
  getRpgPermission(
    rpgId: string,
    userId: string,
  ): Promise<{ isOwner: boolean; canManage: boolean }>
}
