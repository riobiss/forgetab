import type { ProfileRepository } from "@/application/profile/ports/ProfileRepository"
import type { ProfileSessionService } from "@/application/profile/ports/ProfileSessionService"
import type { ProfileViewData } from "@/application/profile/types"

export async function loadProfilePageUseCase(
  deps: {
    repository: ProfileRepository
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
    data: {
      name: user?.name ?? null,
      username: user?.username ?? null,
      email: user?.email ?? session.email,
      createdAt: user?.createdAt ?? null,
    },
  }
}
