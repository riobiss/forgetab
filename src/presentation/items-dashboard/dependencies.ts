import type { ItemsDashboardDependencies } from "@/application/itemsDashboard/contracts/ItemsDashboardDependencies"
import { httpItemsDashboardGateway } from "@/infrastructure/itemsDashboard/gateways/httpItemsDashboardGateway"

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
