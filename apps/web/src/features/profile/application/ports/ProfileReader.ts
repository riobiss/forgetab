import type { ProfileViewData } from "@/features/profile/application/types"

export type ProfileReader = {
  getProfile(): Promise<ProfileViewData>
}
