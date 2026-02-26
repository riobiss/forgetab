export const abilityCategoryKeys = [
  "fisicas",
  "magicas",
  "espirituais",
  "elementais",
  "psiquicas",
  "sombras",
  "naturais",
  "tecnologicas",
  "runicas",
  "sanguineas",
  "demoniacas",
  "celestiais",
  "temporais",
  "sonoras",
  "alquimicas",
  "bestiais",
] as const

export type AbilityCategoryKey = (typeof abilityCategoryKeys)[number]

type AbilityCategoryDefinition = {
  key: AbilityCategoryKey
  label: string
  description: string
}

export const abilityCategoryDefinitions: readonly AbilityCategoryDefinition[] = [
  {
    key: "fisicas",
    label: "Fisicas",
    description: "Tecnicas de forca, combate corporal e destreza marcial.",
  },
  {
    key: "magicas",
    label: "Magicas (Arcanas)",
    description: "Feiticos de origem arcana, estudo mistico e manipulacao de mana.",
  },
  {
    key: "espirituais",
    label: "Espirituais / Divinas",
    description: "Poderes ligados a fe, espiritos e energia sagrada.",
  },
  {
    key: "elementais",
    label: "Elementais",
    description: "Controle dos elementos como fogo, agua, terra e ar.",
  },
  {
    key: "psiquicas",
    label: "Psiquicas / Mentais",
    description: "Influencias mentais, telepatia e foco psicologico.",
  },
  {
    key: "sombras",
    label: "Sombras / Ocultas",
    description: "Tecnicas furtivas, obscuras e de manipulacao das sombras.",
  },
  {
    key: "naturais",
    label: "Naturais / Druidicas",
    description: "Poderes da natureza, fauna, flora e ciclos naturais.",
  },
  {
    key: "tecnologicas",
    label: "Tecnologicas / Mecanicas",
    description: "Dispositivos, engenharia e recursos tecnologicos.",
  },
  {
    key: "runicas",
    label: "Runicas / Selos",
    description: "Inscricoes, selos e ativacoes por runas.",
  },
  {
    key: "sanguineas",
    label: "Sanguineas / Biologicas",
    description: "Habilidades associadas a sangue, biologia e vitalidade.",
  },
  {
    key: "demoniacas",
    label: "Demoniacas / Infernais",
    description: "Poderes de origem infernal, maldita ou abissal.",
  },
  {
    key: "celestiais",
    label: "Celestiais / Sagradas",
    description: "Poderes de luz, protecao e energia celestial.",
  },
  {
    key: "temporais",
    label: "Temporais / Espaciais",
    description: "Manipulacao de tempo, espaco, deslocamento e distorcoes.",
  },
  {
    key: "sonoras",
    label: "Sonoras / Musicais",
    description: "Tecnicas baseadas em som, ritmo e harmonias.",
  },
  {
    key: "alquimicas",
    label: "Alquimicas",
    description: "Preparos, transmutacoes e reacoes alquimicas.",
  },
  {
    key: "bestiais",
    label: "Bestiais / Primitivas",
    description: "Instintos, ferocidade e poderes de origem selvagem.",
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
