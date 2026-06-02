import type { ProfileReader } from "@/application/profile/ports/ProfileReader"
import type { ProfileSessionService } from "@/application/profile/ports/ProfileSessionService"
import type { ProfileViewData } from "@/application/profile/types"
import { buildProfileViewData } from "@/application/profile/use-cases/profileViewData"

export async function loadProfilePageUseCase(
  deps: {
    repository: ProfileReader
    sessionService: ProfileSessionService
  },
): Promise<{ status: "unauthenticated" } | { status: "ok"; data: ProfileViewData }> {
  const session = await deps.sessionService.getAuthenticatedUser()

  if (!session) {
    return { status: "unauthenticated" }
  }

  const user = await deps.repository.getByUserId(session.userId)

  return {
    status: "ok",
    data: buildProfileViewData({ user, fallbackEmail: session.email }),
  }
}
