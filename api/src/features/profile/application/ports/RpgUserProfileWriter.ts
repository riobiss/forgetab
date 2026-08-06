export type RpgUserProfileWriter = {
  updateRpgProfile(
    userId: string,
    rpgId: string,
    values: {
      displayName?: string | null
      profileImageUrl?: string | null
    }
  ): Promise<{
    rpgId: string
    nickname: string | null
    profileImageUrl: string | null
  }>
}
