export type InventoryRarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

export type InventoryCardItem = {
  id: string
  title: string
  rarityLabel: string
  rarityClass: InventoryRarity
  quantity: number
  description?: string
  secondaryLine?: string
  ability?: string
  metaLines?: string[]
  coreStats?: Array<{
    label: string
    value: string
  }>
}
