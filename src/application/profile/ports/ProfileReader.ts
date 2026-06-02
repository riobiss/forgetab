import type { ProfileUserRecord } from "@/application/profile/types"

export type ProfileReader = {
  getByUserId(userId: string): Promise<ProfileUserRecord | null>
}
