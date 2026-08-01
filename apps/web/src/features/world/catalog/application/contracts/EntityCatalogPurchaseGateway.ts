import type { EntityCatalogAbilityPurchaseResult } from "@/features/world/catalog/application/types"

export interface EntityCatalogPurchaseGateway {
  buySkill(
    characterId: string,
    payload: { skillId: string; level: number },
  ): Promise<EntityCatalogAbilityPurchaseResult>
}
