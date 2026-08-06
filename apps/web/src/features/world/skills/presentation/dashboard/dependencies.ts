import type { SkillsDashboardDependencies } from "@/features/world/skills/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import { httpSkillsDashboardGateway } from "@/features/world/skills/infrastructure/dashboard/gateways/httpSkillsDashboardGateway"

export type SkillsDashboardGatewayFactory = "http"

export function createSkillsDashboardDependencies(
  factory: SkillsDashboardGatewayFactory = "http"
): SkillsDashboardDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpSkillsDashboardGateway }
  }
}
