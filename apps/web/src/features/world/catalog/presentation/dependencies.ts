import type { EntityCatalogDependencies } from "@/features/world/catalog/application/contracts/EntityCatalogDependencies"
import { httpEntityCatalogGateway } from "@/features/world/catalog/infrastructure/gateways/httpEntityCatalogGateway"

export type EntityCatalogGatewayFactory = "http"

export function createEntityCatalogDependencies(
  factory: EntityCatalogGatewayFactory = "http",
): EntityCatalogDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpEntityCatalogGateway }
  }
}
