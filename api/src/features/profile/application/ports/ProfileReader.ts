import type { ProfileUserRecord } from "@/features/profile/application/types"

export type ProfileReader = {
  getByUserId(userId: string): Promise<ProfileUserRecord | null>
}
