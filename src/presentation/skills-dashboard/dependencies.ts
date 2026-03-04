import type { SkillsDashboardDependencies } from "@/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import { httpSkillsDashboardGateway } from "@/infrastructure/skillsDashboard/gateways/httpSkillsDashboardGateway"

export type SkillsDashboardGatewayFactory = "http"

export function createSkillsDashboardDependencies(
  factory: SkillsDashboardGatewayFactory = "http",
): SkillsDashboardDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpSkillsDashboardGateway }
  }
}
