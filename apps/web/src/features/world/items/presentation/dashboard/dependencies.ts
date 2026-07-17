import type { ItemsDashboardDependencies } from "@/features/world/items/application/dashboard/contracts/ItemsDashboardDependencies"
import { httpItemsDashboardGateway } from "@/features/world/items/infrastructure/dashboard/gateways/httpItemsDashboardGateway"

export type ItemsDashboardGatewayFactory = "http"

export function createItemsDashboardDependencies(
  factory: ItemsDashboardGatewayFactory = "http",
): ItemsDashboardDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpItemsDashboardGateway }
  }
}
