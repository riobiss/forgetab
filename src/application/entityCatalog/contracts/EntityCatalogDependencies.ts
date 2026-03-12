import type { EntityCatalogGateway } from "@/application/entityCatalog/contracts/EntityCatalogGateway"

export type EntityCatalogDependencies = {
  gateway: EntityCatalogGateway
}
