export type CharacterInventoryRarityDto =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"

export type CharacterInventoryItemDto = {
  id: string
  rpgId: string
  characterId: string
  baseItemId: string
  quantity: number
  itemName: string
  itemImage: string | null
  itemDescription: string | null
  itemPreRequirement: string | null
  itemType: string
  itemRarity: CharacterInventoryRarityDto
  itemDamage: string | null
  itemRange: string | null
  itemAbility: string | null
  itemAbilityName: string | null
  itemEffect: string | null
  itemEffectName: string | null
  itemAbilities: unknown
  itemEffects: unknown
  itemWeight: number | null
  itemDuration: string | null
  itemDurability: number | null
}

export type CharacterInventoryDataDto = {
  inventory: CharacterInventoryItemDto[]
  useInventoryWeightLimit: boolean
  maxCarryWeight: number | null
}
