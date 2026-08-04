import type { ProfileReader } from "@/features/profile/application/ports/ProfileReader"
import type { ProfileViewData } from "@/features/profile/application/types"

export async function loadProfilePageUseCase(deps: {
  reader: ProfileReader
}): Promise<ProfileViewData> {
  return deps.reader.getProfile()
}
