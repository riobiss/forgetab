import type { ProfileDependencies } from "@/features/profile/application/contracts/ProfileDependencies"
import { httpProfileGateway } from "@/features/profile/infrastructure/gateways/httpProfileGateway"

export type ProfileGatewayFactory = "http"

export function createProfileDependencies(
  factory: ProfileGatewayFactory = "http",
): ProfileDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpProfileGateway }
  }
}
