import { STATUS_CATALOG } from "@forgetab/world-contracts/rpg/statusCatalog"
import slugify from "@forgetab/world-contracts/shared/slugify"
import { AppError } from "@/features/shared/application/errors/AppError"

export function parseJsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return Object.entries(value as Record<string, unknown>).reduce<
    Record<string, number>
  >((result, [key, current]) => {
    if (typeof current === "number" && Number.isFinite(current)) {
      result[key] = Math.floor(current)
    }
    return result
  }, {})
}

export function createUniqueKey(
  label: string,
  used: Set<string>,
  fallback: string
) {
  const base = slugify(label) || fallback
  let key = base
  let suffix = 2
  while (used.has(key)) key = `${base}-${suffix++}`
  used.add(key)
  return key
}

export function readOptionalTemplateId(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined
  }
  const candidate = (value as { id?: unknown }).id
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : undefined
}

export function createStableTemplateKey(
  source: unknown,
  label: string,
  used: Set<string>,
  fallback: string
) {
  const candidate =
    source && typeof source === "object" && !Array.isArray(source)
      ? (source as { key?: unknown }).key
      : undefined
  const existingKey =
    typeof candidate === "string" && candidate.trim()
      ? slugify(candidate.trim())
      : undefined
  const base = existingKey || slugify(label) || fallback
  let key = base
  let suffix = 2
  while (used.has(key)) key = `${base}-${suffix++}`
  used.add(key)
  return key
}

export function normalizeAttributeTemplates(input: unknown) {
  const entries = Array.isArray(input) ? input : []
  const templates: Array<{ key: string; label: string }> = []
  const usedKeys = new Set<string>()
  for (const rawEntry of entries) {
    if (!rawEntry || typeof rawEntry !== "object") continue
    const entry = rawEntry as { key?: string; label?: string }
    const label = (entry.label ?? "").trim()
    if (label.length < 2) {
      throw new AppError(
        "Cada atributo precisa de um nome com pelo menos 2 caracteres.",
        400
      )
    }
    const candidateKey = slugify(entry.key?.trim() || label)
    if (!candidateKey) {
      throw new AppError(
        `Nao foi possivel gerar chave para o atributo ${label}.`,
        400
      )
    }
    templates.push({
      key: createUniqueKey(candidateKey, usedKeys, candidateKey),
      label
    })
  }
  return templates
}

export function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
}

export function normalizeStatusLabel(key: string, label: string) {
  return normalizeStatusKey(key) === "exhaustion" ? "Exaustão" : label
}

export function normalizeStatusTemplates(input: unknown) {
  const entries = Array.isArray(input) ? input : []
  const fromCatalog = new Map<string, string>(
    STATUS_CATALOG.map((item) => [item.key, item.label])
  )
  const seen = new Set<string>()
  const normalized: Array<{ key: string; label: string }> = []
  for (const entry of entries) {
    if (typeof entry === "string") {
      const key = normalizeStatusKey(entry.trim())
      if (key && !seen.has(key)) {
        seen.add(key)
        normalized.push({
          key,
          label: normalizeStatusLabel(key, fromCatalog.get(key) ?? key)
        })
      }
      continue
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new AppError("Status invalido.", 400)
    }
    const candidate = entry as { key?: unknown; label?: unknown }
    const key =
      typeof candidate.key === "string"
        ? normalizeStatusKey(candidate.key.trim())
        : ""
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : ""
    if (!key.match(/^[a-z0-9-]{2,40}$/)) {
      throw new AppError(`Chave de status inválida: ${key || "vazia"}.`, 400)
    }
    if (label.length < 2) {
      throw new AppError(`Nome de status inválido para chave ${key}.`, 400)
    }
    if (!seen.has(key)) {
      seen.add(key)
      normalized.push({ key, label: normalizeStatusLabel(key, label) })
    }
  }
  if (normalized.length === 0) {
    throw new AppError("Selecione pelo menos 1 status.", 400)
  }
  return normalized
}

export function normalizeSkillTemplates(input: unknown) {
  const entries = Array.isArray(input) ? input : []
  const labels = entries
    .map((item) => {
      if (typeof item === "string") return item.trim()
      if (item && typeof item === "object" && "label" in item) {
        const label = (item as { label?: unknown }).label
        return typeof label === "string" ? label.trim() : ""
      }
      return ""
    })
    .filter(Boolean)
  const uniqueByKey = new Map<string, string>()
  for (const label of labels) {
    const key = label.toLocaleLowerCase("pt-BR")
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, label)
  }
  const unique = Array.from(uniqueByKey.values())
  const invalid = unique.find((label) => label.length < 2)
  if (invalid) throw new AppError(`Pericia invalida: ${invalid}.`, 400)
  const usedKeys = new Set<string>()
  return unique.map((label, index) => ({
    key: createUniqueKey(label, usedKeys, `pericia-${index + 1}`),
    label
  }))
}

export function normalizeTemplateFields(
  input: unknown,
  invalidMessage: string,
  shortMessage: string,
  fallbackKey: string
) {
  const entries = Array.isArray(input) ? input : []
  const usedKeys = new Set<string>()
  return entries.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new AppError(invalidMessage, 400)
    }
    const candidate = entry as { label?: unknown; required?: unknown }
    const label =
      typeof candidate.label === "string" ? candidate.label.trim() : ""
    if (label.length < 2) throw new AppError(shortMessage, 400)
    return {
      key: createUniqueKey(label, usedKeys, fallbackKey),
      label,
      required: candidate.required !== false
    }
  })
}
