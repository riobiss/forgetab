export type RpgUserProfileWriter = {
  updateRpgDisplayName(
    userId: string,
    rpgId: string,
    displayName: string | null,
  ): Promise<{ rpgId: string; nickname: string | null }>
}
