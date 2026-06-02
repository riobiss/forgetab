import type { ProfileDependencies } from "@/application/profile/contracts/ProfileDependencies"
import type {
  UpdateProfilePayload,
  UpdateRpgProfilePayload,
} from "@/application/profile/contracts/ProfileGateway"

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
