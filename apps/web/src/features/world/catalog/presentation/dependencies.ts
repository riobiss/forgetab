import type { EntityCatalogDependencies } from "@/features/world/catalog/application/contracts/EntityCatalogDependencies"
import {
  httpEntityCatalogCollectionGateway,
  httpEntityCatalogPurchaseGateway,
} from "@/features/world/catalog/infrastructure/gateways/httpEntityCatalogGateway"

export const entityCatalogDependencies: EntityCatalogDependencies = {
  collectionGateway: httpEntityCatalogCollectionGateway,
  purchaseGateway: httpEntityCatalogPurchaseGateway,
}
