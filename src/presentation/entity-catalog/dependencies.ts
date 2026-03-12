import type { EntityCatalogDependencies } from "@/application/entityCatalog/contracts/EntityCatalogDependencies"
import { httpEntityCatalogGateway } from "@/infrastructure/entityCatalog/gateways/httpEntityCatalogGateway"

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
