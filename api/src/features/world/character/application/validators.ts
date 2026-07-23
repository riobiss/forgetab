import type { JsonValue } from "@/application/shared/json"
import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG,
} from "@/lib/rpg/statusCatalog"
import type {
  AttributeTemplateRow,
  CharacterCharacteristicTemplateRow,
  CharacterIdentityTemplateRow,
  CharacterRow,
  SkillTemplateRow,
  StatusTemplateRow,
} from "./types"

type ValidationSuccess<T> = { ok: true; value: T }
type ValidationFailure = { ok: false; message: string }
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure
type NumericTemplateRow =
  | Pick<AttributeTemplateRow, "key">
  | Pick<SkillTemplateRow, "key">
  | Pick<StatusTemplateRow, "key">
type TextTemplateRow =
  | Pick<CharacterIdentityTemplateRow, "key" | "label" | "required">
  | Pick<CharacterCharacteristicTemplateRow, "key" | "label" | "required">

function toObjectRecord(incoming: unknown): Record<string, unknown> {
  return incoming && typeof incoming === "object" && !Array.isArray(incoming)
    ? (incoming as Record<string, unknown>)
    : {}
}

function buildNumericRecord(
  sourceRecord: Record<string, unknown>,
  allowedKeys: string[],
): Record<string, number> {
  return allowedKeys.reduce<Record<string, number>>((acc, key) => {
    const value = sourceRecord[key]
    if (value === undefined || value === null || value === "") {
      acc[key] = 0
      return acc
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      acc[key] = value
    } else {
      acc[key] = Number.NaN
    }
    return acc
  }, {})
}

function validateNumericPayload(
  incoming: unknown,
  template: NumericTemplateRow[],
  labels: {
    invalidValue: (key: string) => string
    extraKey: (key: string) => string
  },
  options?: {
    normalizeKey?: (key: string) => string
    allowNegative?: boolean
    finalizeValue?: (value: number) => number
  },
): ValidationResult<Record<string, number>> {
  const normalizeKey = options?.normalizeKey ?? ((key: string) => key)
  const sourceRecord = Object.entries(toObjectRecord(incoming)).reduce<Record<string, unknown>>(
    (acc, [rawKey, value]) => {
      acc[normalizeKey(rawKey)] = value
      return acc
    },
    {},
  )
  const allowedKeys = template.map((item) => normalizeKey(item.key))
  const record = buildNumericRecord(sourceRecord, allowedKeys)

  for (const key of allowedKeys) {
    const value = record[key]
    if (Number.isNaN(value) || (!options?.allowNegative && value < 0)) {
      return { ok: false, message: labels.invalidValue(key) }
    }
  }

  const extraKey = Object.keys(sourceRecord).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false, message: labels.extraKey(extraKey) }
  }

  const finalized = options?.finalizeValue
    ? allowedKeys.reduce<Record<string, number>>((acc, key) => {
        acc[key] = options.finalizeValue!(record[key])
        return acc
      }, {})
    : record

  return { ok: true, value: finalized }
}

function validateTemplateTextPayload(
  incoming: unknown,
  template: TextTemplateRow[],
  invalidPayloadMessage: string,
): ValidationResult<Record<string, string>> {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    if (template.length === 0) {
      return { ok: true, value: {} }
    }
    return { ok: false, message: invalidPayloadMessage }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const item of template) {
    const raw = record[item.key]
    const value = typeof raw === "string" ? raw.trim() : ""
    if (item.required && value.length === 0) {
      return { ok: false, message: `Campo obrigatorio ausente: ${item.label}.` }
    }
    if (raw !== undefined && typeof raw !== "string") {
      return { ok: false, message: `Valor invalido para ${item.label}.` }
    }
  }

  const invalidExtraKey = Object.entries(record).find(
    ([key, value]) => !allowedKeys.includes(key) && typeof value !== "string",
  )
  if (invalidExtraKey) {
    return { ok: false, message: `Valor invalido para ${invalidExtraKey[0]}.` }
  }

  const normalizedFromTemplate = template.reduce<Record<string, string>>((acc, item) => {
    const value = record[item.key]
    acc[item.key] = typeof value === "string" ? value.trim() : ""
    return acc
  }, {})

  const extraFields = Object.entries(record).reduce<Record<string, string>>((acc, [key, value]) => {
    if (!allowedKeys.includes(key) && typeof value === "string") {
      acc[key] = value.trim()
    }
    return acc
  }, {})

  return { ok: true, value: { ...normalizedFromTemplate, ...extraFields } }
}

export function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
}

export function validateAttributesPayload(
  incoming: unknown,
  template: AttributeTemplateRow[],
) {
  return validateNumericPayload(
    incoming,
    template,
    {
      invalidValue: (key) => `Valor invalido para atributo ${key}.`,
      extraKey: (key) => `Atributo fora do padrao: ${key}.`,
    },
    {
      allowNegative: true,
    },
  )
}

export function validateStatusesPayload(
  incoming: unknown,
  template: StatusTemplateRow[],
) {
  return validateNumericPayload(
    incoming,
    template,
    {
      invalidValue: (key) => `Valor invalido para status ${key}.`,
      extraKey: (key) => `Status fora do padrao: ${key}.`,
    },
    {
      normalizeKey: normalizeStatusKey,
    },
  )
}

export function validateSkillsPayload(
  incoming: unknown,
  template: SkillTemplateRow[],
) {
  return validateNumericPayload(
    incoming,
    template,
    {
      invalidValue: (key) => `Valor invalido para pericia ${key}.`,
      extraKey: (key) => `Pericia fora do padrao: ${key}.`,
    },
    {
      finalizeValue: Math.floor,
    },
  )
}

export function validateIdentityPayload(
  incoming: unknown,
  template: CharacterIdentityTemplateRow[],
) {
  return validateTemplateTextPayload(incoming, template, "Identidade invalida.")
}

export function validateCharacteristicsPayload(
  incoming: unknown,
  template: CharacterCharacteristicTemplateRow[],
) {
  return validateTemplateTextPayload(incoming, template, "Caracteristicas invalidas.")
}

export function isValidCharacterType(value: unknown): value is CharacterRow["characterType"] {
  return value === "player" || value === "npc" || value === "monster"
}

export function isValidVisibility(value: unknown): value is CharacterRow["visibility"] {
  return value === "private" || value === "public"
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
    return { ok: true as const, value: 0 }
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: "Valor atual de progressao invalido." }
  }

  return { ok: true as const, value: Math.floor(value) }
}

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getDefaultStatusTemplate(): StatusTemplateRow[] {
  return STATUS_CATALOG.filter((item) => DEFAULT_STATUS_KEYS.includes(item.key)).map(
    (item, index) => ({
      key: item.key,
      label: item.label,
      position: index,
    }),
  )
}

export function parseJsonBonusRecord(value: JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (acc, [key, current]) => {
      if (typeof current === "number" && Number.isFinite(current)) {
        acc[key] = Math.floor(current)
      }
      return acc
    },
    {},
  )
}
