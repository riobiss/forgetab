import type { ProfileReader } from "@/features/profile/application//ports/ProfileReader"
import type { ProfileSessionService } from "@/features/profile/application//ports/ProfileSessionService"
import type { ProfileViewData } from "@/features/profile/application//types"
import { buildProfileViewData } from "@/features/profile/application//use-cases/profileViewData"

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
