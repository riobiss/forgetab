import type { ProfileDependencies } from "@/features/profile/application/contracts/ProfileDependencies"
import type {
  UpdateProfilePayload,
  UpdateRpgProfilePayload,
  UploadRpgProfileImagePayload,
} from "@/features/profile/application/contracts/ProfileGateway"

export async function updateProfileClientUseCase(
  deps: ProfileDependencies,
  payload: UpdateProfilePayload,
) {
  return deps.gateway.updateProfile(payload)
}

export async function updateRpgProfileClientUseCase(
  deps: ProfileDependencies,
  params: { rpgId: string; payload: UpdateRpgProfilePayload },
) {
  return deps.gateway.updateRpgProfile(params.rpgId, params.payload)
}

export async function uploadRpgProfileImageClientUseCase(
  deps: ProfileDependencies,
  payload: UploadRpgProfileImagePayload,
) {
  return deps.gateway.uploadRpgProfileImage(payload)
}
