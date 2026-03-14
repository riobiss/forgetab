import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type { CharacterInventoryDataDto } from "@/application/characterInventory/types"

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
