export type RpgProfileAccessService = {
  canEditRpgProfile(rpgId: string, userId: string): Promise<boolean>
}
