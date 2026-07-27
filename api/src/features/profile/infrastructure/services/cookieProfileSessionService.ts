import type { ProfileSessionService } from "@/features/profile/application/ports/ProfileSessionService"

export const cookieProfileSessionService: ProfileSessionService = {
  async getAuthenticatedUser() {
    return null
  },
}
