import type { EntityCatalogAbilityView } from "@/features/world/catalog/application/types"

export interface EntityCatalogAbilityRepository {
  listClassAbilities(
    classTemplateId: string
  ): Promise<EntityCatalogAbilityView[]>
  listRaceAbilities(raceTemplateId: string): Promise<EntityCatalogAbilityView[]>
}
