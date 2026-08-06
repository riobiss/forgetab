import { httpProfileGateway } from "@/features/profile/infrastructure/gateways/httpProfileGateway"
import { createRoundCroppedFile } from "@/features/profile/infrastructure/images/createRoundCroppedFile"

export const profileDependencies = {
  gateway: httpProfileGateway,
  createRoundCroppedFile,
} as const
