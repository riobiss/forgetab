import type { PurchasedAbilityViewDto } from "@/application/characterAbilities/types"
import type { CharacterInventoryDataDto } from "@/application/characterInventory/types"

export type NpcCreatureLoadoutItemOptionDto = {
  id: string
  name: string
  image: string | null
  type: string
  rarity: string
}

export type NpcCreatureLoadoutSkillOptionDto = {
  id: string
  slug: string
  tags: string[]
}

export type NpcCreatureAbilitiesDataDto = {
  characterName: string
  abilities: PurchasedAbilityViewDto[]
}

export type NpcCreatureInventoryDataDto = CharacterInventoryDataDto
