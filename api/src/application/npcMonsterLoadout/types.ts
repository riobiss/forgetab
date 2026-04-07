import type { PurchasedAbilityViewDto } from "@/application/characters/abilities/types"
import type { CharacterInventoryDataDto } from "@/application/characters/inventory/types"

export type NpcMonsterLoadoutItemOptionDto = {
  id: string
  name: string
  image: string | null
  type: string
  rarity: string
}

export type NpcMonsterLoadoutSkillOptionDto = {
  id: string
  slug: string
  tags: string[]
}

export type NpcMonsterAbilitiesDataDto = {
  characterName: string
  abilities: PurchasedAbilityViewDto[]
}

export type NpcMonsterInventoryDataDto = CharacterInventoryDataDto
