import type { EntityCatalogAbilityPurchaseState } from "@/features/world/catalog/application/types"

export interface EntityCatalogPurchaseRepository {
  getClassPurchaseState(params: {
    rpgId: string
    userId: string
    classKey: string
    costsEnabled: boolean
    costResourceName: string
  }): Promise<EntityCatalogAbilityPurchaseState>
  getRacePurchaseState(params: {
    rpgId: string
    userId: string
    raceKey: string
  }): Promise<EntityCatalogAbilityPurchaseState>
}
