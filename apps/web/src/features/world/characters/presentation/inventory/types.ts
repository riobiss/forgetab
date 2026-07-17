export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

export type InventoryCardItem = {
  id: string
  title: string
  imageUrl?: string
  rarityLabel: string
  rarityClass: InventoryRarity
  quantity: number
  description?: string
  secondaryLine?: string
  ability?: string
  abilityEntries?: Array<{
    name: string
    description: string
  }>
  effectEntries?: Array<{
    name: string
    description: string
  }>
  coreStats?: Array<{
    label: string
    value: string
  }>
}
