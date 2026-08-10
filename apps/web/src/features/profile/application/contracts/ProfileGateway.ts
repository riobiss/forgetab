import type { UploadImageFile } from "@/features/media/application/types"

export type UpdateProfilePayload = {
  name?: string
  username?: string
}

export type UpdateRpgProfilePayload = {
  displayName?: string | null
  profileImageUrl?: string | null
}

export type UploadRpgProfileImagePayload = {
  file: UploadImageFile
  oldUrl?: string | null
}

export interface ProfileGateway {
  updateProfile(payload: UpdateProfilePayload): Promise<void>
  updateRpgProfile(
    rpgId: string,
    payload: UpdateRpgProfilePayload
  ): Promise<void>
  uploadRpgProfileImage(
    payload: UploadRpgProfileImagePayload
  ): Promise<{ url: string }>
}
