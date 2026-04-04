import { baseItemRarityValues, baseItemTypeValues } from "@/lib/validators/baseItem"

export type SharedItemType = (typeof baseItemTypeValues)[number]
export type SharedItemRarity = (typeof baseItemRarityValues)[number]

export const itemTypeLabel: Record<SharedItemType, string> = {
  equipment: "Equipamento",
  consumable: "Consumivel",
  material: "Material",
  tool: "Ferramenta",
  quest: "Missao",
  special: "Especial",
}

export const itemRarityLabel: Record<SharedItemRarity, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Epico",
  legendary: "Lendario",
}
