import type {
  ProfileGateway,
  UpdateProfilePayload,
  UpdateRpgProfilePayload,
  UploadRpgProfileImagePayload,
} from "@/features/profile/application/contracts/ProfileGateway"

export async function updateProfileClientUseCase(
  deps: { gateway: ProfileGateway },
  payload: UpdateProfilePayload,
) {
  return deps.gateway.updateProfile(payload)
}

export async function updateRpgProfileClientUseCase(
  deps: { gateway: ProfileGateway },
  params: { rpgId: string; payload: UpdateRpgProfilePayload },
) {
  return deps.gateway.updateRpgProfile(params.rpgId, params.payload)
}

export async function uploadRpgProfileImageClientUseCase(
  deps: { gateway: ProfileGateway },
  payload: UploadRpgProfileImagePayload,
) {
  return deps.gateway.uploadRpgProfileImage(payload)
}
