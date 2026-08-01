import type { EntityCatalogCollectionGateway } from "@/features/world/catalog/application/contracts/EntityCatalogCollectionGateway"
import type { EntityCatalogPurchaseGateway } from "@/features/world/catalog/application/contracts/EntityCatalogPurchaseGateway"

export type EntityCatalogDependencies = {
  collectionGateway: EntityCatalogCollectionGateway
  purchaseGateway: EntityCatalogPurchaseGateway
}
