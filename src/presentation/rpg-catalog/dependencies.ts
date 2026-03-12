import type { RpgCatalogDependencies } from "@/application/rpgCatalog/contracts/RpgCatalogDependencies"
import { httpRpgCatalogGateway } from "@/infrastructure/rpgCatalog/gateways/httpRpgCatalogGateway"

export type RpgCatalogGatewayFactory = "http"

export function createRpgCatalogDependencies(
  factory: RpgCatalogGatewayFactory = "http",
): RpgCatalogDependencies {
  switch (factory) {
    case "http":
    default:
      return { gateway: httpRpgCatalogGateway }
  }
}
