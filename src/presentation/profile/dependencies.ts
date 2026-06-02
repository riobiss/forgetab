import type { ProfileDependencies } from "@/application/profile/contracts/ProfileDependencies"
import { httpProfileGateway } from "@/infrastructure/profile/gateways/httpProfileGateway"

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
