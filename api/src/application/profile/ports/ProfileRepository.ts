export type ProfileRepository = {
  getByUserId(userId: string): Promise<{
    name: string | null
    username: string | null
    email: string | null
    createdAt: Date | null
  } | null>
}
