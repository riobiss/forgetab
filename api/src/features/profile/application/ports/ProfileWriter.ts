export type ProfileWriter = {
  updateByUserId(
    userId: string,
    data: {
      name?: string
      username?: string
    }
  ): Promise<{
    name: string | null
    username: string | null
  }>
}
