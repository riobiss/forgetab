type BonusRecord = Record<string, number>

export type ClassRaceTemplateInput = {
  label: string
  attributeBonuses?: Record<string, unknown>
  skillBonuses?: Record<string, unknown>
}

type NormalizedTemplate = {
  label: string
  attributeBonuses: BonusRecord
  skillBonuses: BonusRecord
}

function normalizeBonusRecord(
  candidate: unknown,
  allowedKeys: string[],
  fieldName: "atributos" | "pericias",
) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { ok: true as const, value: {} as BonusRecord }
  }

  const rawRecord = candidate as Record<string, unknown>
  const extraKey = Object.keys(rawRecord).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return {
      ok: false as const,
      message: `${fieldName} fora do padrao: ${extraKey}.`,
    }
  }

  const normalized = allowedKeys.reduce<BonusRecord>((acc, key) => {
    const value = rawRecord[key]
    if (value === undefined) {
      acc[key] = 0
      return acc
    }

    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`Valor invalido para ${fieldName} ${key}.`)
    }

    acc[key] = Math.floor(value)
    return acc
  }, {})

  return { ok: true as const, value: normalized }
}

export function normalizeClassRaceTemplates(
  incoming: unknown,
  allowedAttributeKeys: string[],
  allowedSkillKeys: string[],
) {
  if (!Array.isArray(incoming)) {
    return { ok: false as const, message: "Formato invalido de lista." }
  }

  const labelsSeen = new Set<string>()
  const normalized: NormalizedTemplate[] = []

  for (const item of incoming) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false as const, message: "Item invalido na lista." }
    }

    const parsed = item as ClassRaceTemplateInput
    const label = parsed.label?.trim() ?? ""
    if (label.length < 2) {
      return { ok: false as const, message: "Nome precisa ter pelo menos 2 caracteres." }
    }

    const normalizedLabelKey = label.toLocaleLowerCase("pt-BR")
    if (labelsSeen.has(normalizedLabelKey)) {
      return { ok: false as const, message: `Nome repetido: ${label}.` }
    }
    labelsSeen.add(normalizedLabelKey)

    let attributeBonuses: BonusRecord = {}
    try {
      const parsedAttributes = normalizeBonusRecord(
        parsed.attributeBonuses,
        allowedAttributeKeys,
        "atributos",
      )
      if (!parsedAttributes.ok) {
        return { ok: false as const, message: parsedAttributes.message }
      }
      attributeBonuses = parsedAttributes.value
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Bonus de atributos invalido.",
      }
    }

    let skillBonuses: BonusRecord = {}
    try {
      const parsedSkills = normalizeBonusRecord(parsed.skillBonuses, allowedSkillKeys, "pericias")
      if (!parsedSkills.ok) {
        return { ok: false as const, message: parsedSkills.message }
      }
      skillBonuses = parsedSkills.value
    } catch (error) {
      return {
        ok: false as const,
        message: error instanceof Error ? error.message : "Bonus de pericias invalido.",
      }
    }

    normalized.push({
      label,
      attributeBonuses,
      skillBonuses,
    })
  }

  return { ok: true as const, values: normalized }
}

export function addBonusToBase(
  base: Record<string, number>,
  raceBonus: Record<string, number>,
  classBonus: Record<string, number>,
) {
  const keys = new Set([
    ...Object.keys(base),
    ...Object.keys(raceBonus),
    ...Object.keys(classBonus),
  ])

  const merged: Record<string, number> = {}
  for (const key of keys) {
    merged[key] = Math.floor((base[key] ?? 0) + (raceBonus[key] ?? 0) + (classBonus[key] ?? 0))
  }

  return merged
}
