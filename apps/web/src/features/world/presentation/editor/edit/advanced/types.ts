import type { EntityCatalogMeta } from "@/features/world/catalog/domain/types"
import type { RaceLore } from "@/lib/rpg/raceLore"

export type AdvancedIdentityType = "race" | "class"

export type IdentityTemplateDraft = {
  key: string
  label: string
  category?: string
  attributeBonuses: Record<string, number>
  skillBonuses: Record<string, number>
  lore?: RaceLore
  catalogMeta: EntityCatalogMeta
}
