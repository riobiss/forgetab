export const ATTRIBUTE_CATALOG = [
  { key: "strength", label: "Forca" },
  { key: "dexterity", label: "Destreza" },
  { key: "constitution", label: "Constituicao" },
  { key: "intelligence", label: "Inteligencia" },
  { key: "knowledge", label: "Conhecimento" },
  { key: "wisdom", label: "Sabedoria" },
  { key: "charisma", label: "Carisma" },
  { key: "agility", label: "Agilidade" },
  { key: "instinct", label: "Instinto" },
  { key: "luck", label: "Sorte" },
  { key: "willpower", label: "Forca de Vontade" },
] as const

export type AttributeCatalogItem = (typeof ATTRIBUTE_CATALOG)[number]
export type AttributeKey = AttributeCatalogItem["key"]

export const DEFAULT_ATTRIBUTE_KEYS: AttributeKey[] = [
  "strength",
  "dexterity",
  "constitution",
  "knowledge",
  "wisdom",
  "charisma",
  "agility",
  "instinct"
]
