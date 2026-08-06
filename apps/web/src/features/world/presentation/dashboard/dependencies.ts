import type { RpgDashboardGateway } from "@/features/world/application/dashboard/contracts/RpgDashboardGateway"
import { httpRpgDashboardGateway } from "@/features/world/infrastructure/dashboard/gateways/httpRpgDashboardGateway"

export type RpgDashboardDependencies = {
  gateway: RpgDashboardGateway
}

export function createRpgDashboardDependencies(): RpgDashboardDependencies {
  return {
    gateway: httpRpgDashboardGateway
  }
}
