export const STATUS_CATALOG = [
  { key: "life", label: "Vida" },
  { key: "defense", label: "Defesa" },
  { key: "mana", label: "Mana" },
  { key: "exhaustion", label: "Exaustão" },
  { key: "sanity", label: "Sanidade" },
  { key: "shield", label: "Escudo" },
  { key: "energy", label: "Energia" },
  { key: "focus", label: "Foco" },
  { key: "faith", label: "Fe" },
  { key: "rage", label: "Furia" },
] as const

export type StatusCatalogItem = (typeof STATUS_CATALOG)[number]
export type StatusKey = StatusCatalogItem["key"]

export const DEFAULT_STATUS_KEYS: StatusKey[] = [
  "life",
  "defense",
  "mana",
  "exhaustion",
  "sanity",
]
