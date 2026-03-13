import type { ItemType } from "./types"
import type { ItemRarityDto } from "@/application/itemsEditor/types"

export const itemTypeLabel: Record<ItemType, string> = {
  equipment: "Equipamento",
  consumable: "Consumivel",
  material: "Material",
  tool: "Ferramenta",
  quest: "Missao",
  special: "Especial",
}

export const itemRarityLabel: Record<ItemRarityDto, string> = {
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Epico",
  legendary: "Lendario",
}
