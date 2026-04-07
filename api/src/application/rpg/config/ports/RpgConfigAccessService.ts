export interface RpgConfigAccessService {
  canManageRpg(rpgId: string, userId: string): Promise<boolean>
  canReadRpg(rpgId: string, userId: string): Promise<boolean>
}

