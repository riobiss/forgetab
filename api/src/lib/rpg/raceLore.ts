export type RaceLoreKingdom = {
  name: string
  description: string
  culture: string[]
  physicalTraits: string[]
  clothing: string[]
  commonNames: string[]
}

export type RaceLoreVariation = {
  name: string
  description: string
  traits: string[]
}

export type RaceLore = {
  summary: string
  origin: string
  thoughts: string[]
  kingdoms: RaceLoreKingdom[]
  notableFigures: string[]
  racialTraits: string[]
  commonClasses: string[]
  variations: RaceLoreVariation[]
}

function toTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
}

function normalizeKingdom(value: unknown): RaceLoreKingdom | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const name = toTrimmedString(record.name)
  const description = toTrimmedString(record.description)
  if (name.length === 0 && description.length === 0) {
    return null
  }

  return {
    name,
    description,
    culture: toStringArray(record.culture),
    physicalTraits: toStringArray(record.physicalTraits),
    clothing: toStringArray(record.clothing),
    commonNames: toStringArray(record.commonNames),
  }
}

function normalizeVariation(value: unknown): RaceLoreVariation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  const name = toTrimmedString(record.name)
  const description = toTrimmedString(record.description)
  if (name.length === 0 && description.length === 0) {
    return null
  }

  return {
    name,
    description,
    traits: toStringArray(record.traits),
  }
}

export function createDefaultRaceLore(raceLabel = ""): RaceLore {
  const resolvedRace = raceLabel.trim() || "Nova Raca"
  return {
    summary: `${resolvedRace} em poucas linhas.`,
    origin: `Conte a origem de ${resolvedRace}, eventos historicos e mitos centrais.`,
    thoughts: [
      "Humanos: perspectiva sobre a raca.",
      "Pequenos: perspectiva sobre a raca.",
      "Orcs: perspectiva sobre a raca.",
    ],
    kingdoms: [
      {
        name: "Nome do reino",
        description: "Resumo do reino e seu papel no mundo.",
        culture: ["Costume 1", "Costume 2"],
        physicalTraits: ["Traco fisico 1", "Traco fisico 2"],
        clothing: ["Vestimenta 1", "Vestimenta 2"],
        commonNames: ["Nome 1", "Nome 2"],
      },
    ],
    notableFigures: ["Figura marcante 1", "Figura marcante 2"],
    racialTraits: ["Traco racial 1", "Traco racial 2"],
    commonClasses: ["Classe comum 1", "Classe comum 2"],
    variations: [
      {
        name: "Nome da variacao",
        description: "Descricao da variacao.",
        traits: ["Diferenca 1", "Diferenca 2"],
      },
    ],
  }
}

export function normalizeRaceLore(value: unknown, raceLabel = ""): RaceLore {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createDefaultRaceLore(raceLabel)
  }

  const record = value as Record<string, unknown>
  const fallback = createDefaultRaceLore(raceLabel)
  const kingdoms = Array.isArray(record.kingdoms)
    ? record.kingdoms
        .map((item) => normalizeKingdom(item))
        .filter((item): item is RaceLoreKingdom => item !== null)
    : []
  const variations = Array.isArray(record.variations)
    ? record.variations
        .map((item) => normalizeVariation(item))
        .filter((item): item is RaceLoreVariation => item !== null)
    : []

  return {
    summary: toTrimmedString(record.summary) || fallback.summary,
    origin: toTrimmedString(record.origin) || fallback.origin,
    thoughts: toStringArray(record.thoughts),
    kingdoms,
    notableFigures: toStringArray(record.notableFigures),
    racialTraits: toStringArray(record.racialTraits),
    commonClasses: toStringArray(record.commonClasses),
    variations,
  }
}
