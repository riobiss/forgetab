import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG,
} from "@/lib/rpg/statusCatalog"

type AttributeTemplateRow = {
  key: string
  label: string
  position: number
}

type StatusTemplateRow = {
  key: string
  label: string
  position: number
}

type SkillTemplateRow = {
  key: string
  label: string
  position: number
}

type CharacterIdentityTemplateRow = {
  key: string
  label: string
  required: boolean
  position: number
}

type CharacterCharacteristicTemplateRow = {
  key: string
  label: string
  required: boolean
  position: number
}

export function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
}

export function validateAttributesPayload(incoming: unknown, template: AttributeTemplateRow[]) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Atributos invalidos." }
  }
  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)
  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Atributo obrigatorio ausente: ${key}.` }
    }
    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { ok: false as const, message: `Valor invalido para atributo ${key}.` }
    }
  }
  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Atributo fora do padrao: ${extraKey}.` }
  }
  return { ok: true as const, value: record }
}

export function validateStatusesPayload(incoming: unknown, template: StatusTemplateRow[]) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Status invalidos." }
  }
  const sourceRecord = incoming as Record<string, unknown>
  const record = Object.entries(sourceRecord).reduce<Record<string, unknown>>((acc, [rawKey, value]) => {
    acc[normalizeStatusKey(rawKey)] = value
    return acc
  }, {})
  const allowedKeys = template.map((item) => normalizeStatusKey(item.key))
  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Status obrigatorio ausente: ${key}.` }
    }
    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para status ${key}.` }
    }
  }
  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Status fora do padrao: ${extraKey}.` }
  }
  return { ok: true as const, value: record as Record<string, number> }
}

export function validateSkillsPayload(incoming: unknown, template: SkillTemplateRow[]) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Pericias invalidas." }
  }
  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)
  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Pericia obrigatoria ausente: ${key}.` }
    }
    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para pericia ${key}.` }
    }
  }
  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Pericia fora do padrao: ${extraKey}.` }
  }
  const normalized = allowedKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = Math.floor(Number(record[key]))
    return acc
  }, {})
  return { ok: true as const, value: normalized }
}

export function validateIdentityPayload(
  incoming: unknown,
  template: CharacterIdentityTemplateRow[],
) {
  if (template.length === 0) return { ok: true as const, value: {} as Record<string, string> }
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Identidade invalida." }
  }
  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)
  for (const item of template) {
    const raw = record[item.key]
    const value = typeof raw === "string" ? raw.trim() : ""
    if (item.required && value.length === 0) {
      return { ok: false as const, message: `Campo obrigatorio ausente: ${item.label}.` }
    }
    if (raw !== undefined && typeof raw !== "string") {
      return { ok: false as const, message: `Valor invalido para ${item.label}.` }
    }
  }
  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Campo de identidade fora do padrao: ${extraKey}.` }
  }
  const normalized = template.reduce<Record<string, string>>((acc, item) => {
    const value = record[item.key]
    acc[item.key] = typeof value === "string" ? value.trim() : ""
    return acc
  }, {})
  return { ok: true as const, value: normalized }
}

export function validateCharacteristicsPayload(
  incoming: unknown,
  template: CharacterCharacteristicTemplateRow[],
) {
  if (template.length === 0) return { ok: true as const, value: {} as Record<string, string> }
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Caracteristicas invalidas." }
  }
  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)
  for (const item of template) {
    const raw = record[item.key]
    const value = typeof raw === "string" ? raw.trim() : ""
    if (item.required && value.length === 0) {
      return { ok: false as const, message: `Campo obrigatorio ausente: ${item.label}.` }
    }
    if (raw !== undefined && typeof raw !== "string") {
      return { ok: false as const, message: `Valor invalido para ${item.label}.` }
    }
  }
  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Campo de caracteristica fora do padrao: ${extraKey}.` }
  }
  const normalized = template.reduce<Record<string, string>>((acc, item) => {
    const value = record[item.key]
    acc[item.key] = typeof value === "string" ? value.trim() : ""
    return acc
  }, {})
  return { ok: true as const, value: normalized }
}

export function validateStat(name: string, value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: `Valor invalido para ${name}.` }
  }
  return { ok: true as const, value: Math.floor(value) }
}

export function validateMaxCarryWeight(value: unknown) {
  if (value === null || value === undefined) {
    return { ok: true as const, value: null as number | null }
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: "Peso maximo invalido." }
  }
  return { ok: true as const, value }
}

export function validateProgressionCurrent(value: unknown) {
  if (value === undefined || value === null) {
    return { ok: true as const, value: null as number | null }
  }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: "Valor atual de progressao invalido." }
  }
  return { ok: true as const, value: Math.floor(value) }
}

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isValidVisibility(value: unknown): value is "private" | "public" {
  return value === "private" || value === "public"
}

export function getDefaultStatusTemplate(): StatusTemplateRow[] {
  return STATUS_CATALOG.filter((item) => DEFAULT_STATUS_KEYS.includes(item.key)).map(
    (item, index) => ({ key: item.key, label: item.label, position: index }),
  )
}
