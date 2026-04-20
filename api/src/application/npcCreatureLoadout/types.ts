import type { PurchasedAbilityViewDto } from "@/application/characters/abilities/types"
import type { CharacterInventoryDataDto } from "@/application/characters/inventory/types"

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
