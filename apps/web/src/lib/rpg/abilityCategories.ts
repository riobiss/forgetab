export const abilityCategoryKeys = [
  "tecnicas",
  "arcana",
  "espiritual",
  "mental",
  "natural",
  "tecnologica",
] as const

export type AbilityCategoryKey = (typeof abilityCategoryKeys)[number]

type AbilityCategoryDefinition = {
  key: AbilityCategoryKey
  label: string
  description: string
}

export const abilityCategoryDefinitions: readonly AbilityCategoryDefinition[] = [
  {
    key: "tecnicas",
    label: "Técnicas",
    description: "Tecnicas de forca, combate corporal e destreza marcial.",
  },
  {
    key: "arcana",
    label: "Arcana",
    description: "Feiticos de origem arcana, estudo mistico e manipulacao de mana.",
  },
  {
    key: "espiritual",
    label: "Espiritual",
    description: "Poderes ligados a fe, espiritos e energia sagrada.",
  },
  {
    key: "mental",
    label: "Mental",
    description: "Influencias mentais, telepatia e foco psicologico.",
  },
  {
    key: "natural",
    label: "Natural",
    description: "Poderes da natureza, fauna, flora e ciclos naturais.",
  },
  {
    key: "tecnologica",
    label: "Tecnológica",
    description: "Dispositivos, engenharia e recursos tecnologicos.",
  },
]

export const abilityCategoryLabelByKey = abilityCategoryDefinitions.reduce<
  Record<AbilityCategoryKey, string>
>((acc, item) => {
  acc[item.key] = item.label
  return acc
}, {} as Record<AbilityCategoryKey, string>)

export function isAbilityCategoryKey(value: string): value is AbilityCategoryKey {
  return abilityCategoryKeys.includes(value as AbilityCategoryKey)
}

export function normalizeEnabledAbilityCategories(input: unknown): AbilityCategoryKey[] {
  if (!Array.isArray(input)) return []

  const normalized = input.reduce<AbilityCategoryKey[]>((acc, value) => {
    if (typeof value !== "string") return acc
    const parsed = value.trim().toLowerCase()
    if (!isAbilityCategoryKey(parsed)) return acc
    acc.push(parsed)
    return acc
  }, [])

  return Array.from(new Set(normalized))
}
