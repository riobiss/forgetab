export type ProfileSessionService = {
  getAuthenticatedUser(): Promise<{ userId: string; email: string } | null>
}
