import { Prisma } from "../../../../generated/prisma/client.js"
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

export function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
}

export function validateAttributesPayload(
  incoming: unknown,
  template: AttributeTemplateRow[],
) {
  const sourceRecord =
    incoming && typeof incoming === "object" && !Array.isArray(incoming)
      ? (incoming as Record<string, unknown>)
      : {}
  const allowedKeys = template.map((item) => item.key)
  const record = allowedKeys.reduce<Record<string, number>>((acc, key) => {
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

  for (const key of allowedKeys) {
    const value = record[key]
    if (Number.isNaN(value)) {
      return { ok: false as const, message: `Valor invalido para atributo ${key}.` }
    }
  }

  const extraKey = Object.keys(sourceRecord).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Atributo fora do padrao: ${extraKey}.` }
  }

  return { ok: true as const, value: record }
}

export function validateStatusesPayload(
  incoming: unknown,
  template: StatusTemplateRow[],
) {
  const sourceRecordRaw =
    incoming && typeof incoming === "object" && !Array.isArray(incoming)
      ? (incoming as Record<string, unknown>)
      : {}
  const sourceRecord = Object.entries(sourceRecordRaw).reduce<Record<string, unknown>>(
    (acc, [rawKey, value]) => {
      acc[normalizeStatusKey(rawKey)] = value
      return acc
    },
    {},
  )
  const allowedKeys = template.map((item) => normalizeStatusKey(item.key))
  const record = allowedKeys.reduce<Record<string, number>>((acc, key) => {
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

  for (const key of allowedKeys) {
    const value = record[key]
    if (Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para status ${key}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Status fora do padrao: ${extraKey}.` }
  }

  return { ok: true as const, value: record as Record<string, number> }
}

export function validateSkillsPayload(
  incoming: unknown,
  template: SkillTemplateRow[],
) {
  const sourceRecord =
    incoming && typeof incoming === "object" && !Array.isArray(incoming)
      ? (incoming as Record<string, unknown>)
      : {}
  const allowedKeys = template.map((item) => item.key)
  const record = allowedKeys.reduce<Record<string, number>>((acc, key) => {
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

  for (const key of allowedKeys) {
    const value = record[key]
    if (Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para pericia ${key}.` }
    }
  }

  const extraKey = Object.keys(sourceRecord).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Pericia fora do padrao: ${extraKey}.` }
  }

  const normalized = allowedKeys.reduce<Record<string, number>>((acc, key) => {
    acc[key] = Math.floor(record[key])
    return acc
  }, {})

  return { ok: true as const, value: normalized }
}

export function validateIdentityPayload(
  incoming: unknown,
  template: CharacterIdentityTemplateRow[],
) {
  if (template.length === 0) {
    return { ok: true as const, value: {} as Record<string, string> }
  }

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
  if (template.length === 0) {
    return { ok: true as const, value: {} as Record<string, string> }
  }

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

export function isValidCharacterType(value: unknown): value is CharacterRow["characterType"] {
  return value === "player" || value === "npc" || value === "monster"
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

export function parseJsonBonusRecord(value: Prisma.JsonValue) {
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
