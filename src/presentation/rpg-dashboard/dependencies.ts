import type { RpgDashboardGateway } from "@/application/rpgDashboard/contracts/RpgDashboardGateway"
import { httpRpgDashboardGateway } from "@/infrastructure/rpgDashboard/gateways/httpRpgDashboardGateway"

export type RpgDashboardDependencies = {
  gateway: RpgDashboardGateway
}

export function createRpgDashboardDependencies(): RpgDashboardDependencies {
  return {
    gateway: httpRpgDashboardGateway,
  }
}

