import type { ProfileSessionService } from "@/application/profile/ports/ProfileSessionService"

export const cookieProfileSessionService: ProfileSessionService = {
  async getAuthenticatedUser() {
    return null
  },
}
