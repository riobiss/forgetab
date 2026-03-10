import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import { DEFAULT_STATUS_KEYS, STATUS_CATALOG } from "@/lib/rpg/statusCatalog"
import { normalizeClassRaceTemplates } from "@/lib/rpg/classRaceBonuses"
import { normalizeRaceLore } from "@/lib/rpg/raceLore"
import slugify from "@/utils/slugify"
import type { RpgConfigAccessService } from "@/application/rpgConfig/ports/RpgConfigAccessService"
import type { RpgConfigRepository } from "@/application/rpgConfig/ports/RpgConfigRepository"
import {
  assertCanManageRpg,
  assertCanReadRpg,
  wrapAttributeError,
  wrapCharacteristicError,
  wrapClassError,
  wrapIdentityError,
  wrapRaceError,
  wrapStatusError,
} from "@/application/rpgConfig/use-cases/shared"
import { AppError } from "@/shared/errors/AppError"

function parseJsonRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const record = value as Record<string, unknown>
  return Object.entries(record).reduce<Record<string, number>>((acc, [key, current]) => {
    if (typeof current === "number" && Number.isFinite(current)) {
      acc[key] = Math.floor(current)
    }
    return acc
  }, {})
}

function createUniqueKey(label: string, used: Set<string>, fallback: string) {
  const base = slugify(label) || fallback
  let key = base
  let suffix = 2

  while (used.has(key)) {
    key = `${base}-${suffix}`
    suffix += 1
  }

  used.add(key)
  return key
}

function normalizeAttributeTemplates(
  input: unknown,
): Array<{ key: string; label: string }> {
  const entries = Array.isArray(input) ? input : []
  const templates: Array<{ key: string; label: string }> = []
  const usedKeys = new Set<string>()

  for (const rawEntry of entries) {
    if (!rawEntry || typeof rawEntry !== "object") continue
    const entry = rawEntry as { key?: string; label?: string }
    const label = (entry.label ?? "").trim()
    if (label.length < 2) {
      throw new AppError("Cada atributo precisa de um nome com pelo menos 2 caracteres.", 400)
    }

    const candidateKey =
      (typeof entry.key === "string" && entry.key.trim() ? slugify(entry.key.trim()) : slugify(label)) || ""

    if (!candidateKey) {
      throw new AppError(`Nao foi possivel gerar chave para o atributo ${label}.`, 400)
    }

    let uniqueKey = candidateKey
    let suffix = 2
    while (usedKeys.has(uniqueKey)) {
      uniqueKey = `${candidateKey}-${suffix}`
      suffix += 1
    }

    usedKeys.add(uniqueKey)
    templates.push({ key: uniqueKey, label })
  }

  return templates
}

function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
}

function normalizeStatusLabel(key: string, label: string) {
  if (normalizeStatusKey(key) === "exhaustion") return "Exaustão"
  return label
}

function normalizeStatusTemplates(input: unknown) {
  const entries = Array.isArray(input) ? input : []
  const fromCatalog = new Map<string, string>(STATUS_CATALOG.map((item) => [item.key, item.label]))
  const seen = new Set<string>()
  const normalized: Array<{ key: string; label: string }> = []
  const allowed = new Set(STATUS_CATALOG.map((item) => item.key))

  for (const entry of entries) {
    if (typeof entry === "string") {
      const key = normalizeStatusKey(entry.trim())
      if (!key) continue

      if (seen.has(key)) continue
      seen.add(key)
      normalized.push({ key, label: normalizeStatusLabel(key, fromCatalog.get(key) ?? key) })
      continue
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new AppError("Status invalido.", 400)
    }

    const candidate = entry as { key?: unknown; label?: unknown }
    const key = typeof candidate.key === "string" ? normalizeStatusKey(candidate.key.trim()) : ""
    const label = typeof candidate.label === "string" ? candidate.label.trim() : ""

    if (!key.match(/^[a-z0-9-]{2,40}$/)) {
      throw new AppError(`Chave de status inválida: ${key || "vazia"}.`, 400)
    }
    if (label.length < 2) {
      throw new AppError(`Nome de status inválido para chave ${key}.`, 400)
    }

    if (seen.has(key)) continue
    seen.add(key)
    normalized.push({ key, label: normalizeStatusLabel(key, label) })
  }

  if (normalized.length === 0) {
    throw new AppError("Selecione pelo menos 1 status.", 400)
  }

  const invalidCatalog = normalized.find(
    (item) => allowed.has(item.key as (typeof STATUS_CATALOG)[number]["key"]) && !fromCatalog.has(item.key),
  )
  if (invalidCatalog) {
    throw new AppError(`Status inválido: ${invalidCatalog.key}.`, 400)
  }

  return normalized
}

function normalizeTemplateFields(
  input: unknown,
  invalidMessage: string,
  shortMessage: string,
  fallbackKey: string,
) {
  const entries = Array.isArray(input) ? input : []
  const usedKeys = new Set<string>()
  const values: Array<{ key: string; label: string; required: boolean }> = []

  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new AppError(invalidMessage, 400)
    }

    const candidate = entry as { label?: unknown; required?: unknown }
    const label = typeof candidate.label === "string" ? candidate.label.trim() : ""
    if (label.length < 2) {
      throw new AppError(shortMessage, 400)
    }

    const key = createUniqueKey(label, usedKeys, fallbackKey)
    values.push({
      key,
      label,
      required: candidate.required !== false,
    })
  }

  return values
}

export async function getAttributeTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const attributes = await repository.listAttributeTemplates(params.rpgId)
    return { attributes, isDefault: attributes.length === 0 }
  } catch (error) {
    wrapAttributeError(error, "Erro interno ao buscar atributos.")
  }
}

export async function updateAttributeTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; attributes: unknown },
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    await repository.replaceAttributeTemplates(params.rpgId, normalizeAttributeTemplates(params.attributes))
    return { message: "Padrao de atributos atualizado." }
  } catch (error) {
    wrapAttributeError(error, "Erro interno ao atualizar atributos.")
  }
}

export async function getStatusTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const rows = await repository.listStatusTemplates(params.rpgId)

    if (rows.length === 0) {
      return {
        statuses: STATUS_CATALOG.filter((item) => DEFAULT_STATUS_KEYS.includes(item.key)).map((item, index) => ({
          id: `default-${item.key}`,
          key: item.key,
          label: item.label,
          position: index,
        })),
        isDefault: true,
      }
    }

    return {
      statuses: rows.map((item) => {
        const key = normalizeStatusKey(item.key)
        return { ...item, key, label: normalizeStatusLabel(key, item.label) }
      }),
      isDefault: false,
    }
  } catch (error) {
    wrapStatusError(error, "Erro interno ao buscar status.")
  }
}

export async function updateStatusTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; statuses: unknown },
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    await repository.replaceStatusTemplates(params.rpgId, normalizeStatusTemplates(params.statuses))
    return { message: "Padrao de status atualizado." }
  } catch (error) {
    wrapStatusError(error, "Erro interno ao atualizar status.")
  }
}

export async function getRaceTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const rows = await repository.listRaceTemplates(params.rpgId)
    return {
      races: rows.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.label,
        category: item.category ?? "geral",
        position: item.position,
        attributeBonuses: parseJsonRecord(item.attributeBonuses),
        skillBonuses: parseJsonRecord(item.skillBonuses),
        lore: normalizeRaceLore(item.lore, item.label),
        catalogMeta: normalizeEntityCatalogMeta(item.catalogMeta),
      })),
    }
  } catch (error) {
    wrapRaceError(error, "Erro interno ao buscar racas.")
  }
}

export async function updateRaceTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; races: unknown },
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    const allowedAttributeKeys = await repository.listAttributeKeys(params.rpgId)
    const allowedSkillKeys = await repository.listSkillKeys(params.rpgId)
    const incomingRaces = Array.isArray(params.races) ? params.races : []
    const parsed = normalizeClassRaceTemplates(incomingRaces, allowedAttributeKeys, allowedSkillKeys)
    if (!parsed.ok) {
      throw new AppError(parsed.message, 400)
    }

    const used = new Set<string>()
    const items = parsed.values.map((item, index) => {
      const source = incomingRaces[index]
      const sourceLore =
        source && typeof source === "object" && !Array.isArray(source)
          ? (source as { lore?: unknown }).lore
          : undefined

      return {
        key: createUniqueKey(item.label, used, "raca"),
        label: item.label,
        category: item.category,
        attributeBonuses: item.attributeBonuses,
        skillBonuses: item.skillBonuses,
        lore: normalizeRaceLore(sourceLore, item.label),
        catalogMeta:
          source && typeof source === "object" && !Array.isArray(source)
            ? normalizeEntityCatalogMeta((source as { catalogMeta?: unknown }).catalogMeta)
            : normalizeEntityCatalogMeta(undefined),
      }
    })

    await repository.replaceRaceTemplates(params.rpgId, items)
    return { message: "Racas atualizadas com sucesso." }
  } catch (error) {
    wrapRaceError(error, "Erro interno ao salvar racas.")
  }
}

export async function getClassTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    const rows = await repository.listClassTemplates(params.rpgId)
    return {
      classes: rows.map((item) => ({
        id: item.id,
        key: item.key,
        label: item.label,
        category: item.category ?? "geral",
        position: item.position,
        attributeBonuses: parseJsonRecord(item.attributeBonuses),
        skillBonuses: parseJsonRecord(item.skillBonuses),
        catalogMeta: normalizeEntityCatalogMeta(item.catalogMeta),
      })),
    }
  } catch (error) {
    wrapClassError(error, "Erro interno ao buscar classes.")
  }
}

export async function updateClassTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; classes: unknown },
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    const allowedAttributeKeys = await repository.listAttributeKeys(params.rpgId)
    const allowedSkillKeys = await repository.listSkillKeys(params.rpgId)
    const parsed = normalizeClassRaceTemplates(params.classes ?? [], allowedAttributeKeys, allowedSkillKeys)
    if (!parsed.ok) {
      throw new AppError(parsed.message, 400)
    }

    const used = new Set<string>()
    await repository.replaceClassTemplates(
      params.rpgId,
      parsed.values.map((item, index) => ({
        key: createUniqueKey(item.label, used, "classe"),
        label: item.label,
        category: item.category,
        attributeBonuses: item.attributeBonuses,
        skillBonuses: item.skillBonuses,
        catalogMeta:
          params.classes &&
          Array.isArray(params.classes) &&
          params.classes[index] &&
          typeof params.classes[index] === "object" &&
          !Array.isArray(params.classes[index])
            ? normalizeEntityCatalogMeta((params.classes[index] as { catalogMeta?: unknown }).catalogMeta)
            : normalizeEntityCatalogMeta(undefined),
      })),
    )

    return { message: "Classes atualizadas com sucesso." }
  } catch (error) {
    wrapClassError(error, "Erro interno ao salvar classes.")
  }
}

export async function getIdentityTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    return { fields: await repository.listIdentityTemplates(params.rpgId) }
  } catch (error) {
    wrapIdentityError(error, "Erro interno ao buscar campos de identidade.")
  }
}

export async function updateIdentityTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; fields: unknown },
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    const values = normalizeTemplateFields(
      params.fields,
      "Campo de identidade invalido.",
      "Cada campo de identidade precisa ter nome com pelo menos 2 caracteres.",
      "campo-identidade",
    )
    await repository.replaceIdentityTemplates(params.rpgId, values)
    return { message: "Campos de identidade atualizados." }
  } catch (error) {
    wrapIdentityError(error, "Erro interno ao salvar campos de identidade.")
  }
}

export async function getCharacteristicTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string },
) {
  try {
    assertCanReadRpg(await access.canReadRpg(params.rpgId, params.userId))
    return { fields: await repository.listCharacteristicTemplates(params.rpgId) }
  } catch (error) {
    wrapCharacteristicError(error, "Erro interno ao buscar campos de caracteristicas.")
  }
}

export async function updateCharacteristicTemplates(
  access: RpgConfigAccessService,
  repository: RpgConfigRepository,
  params: { rpgId: string; userId: string; fields: unknown },
) {
  try {
    assertCanManageRpg(await access.canManageRpg(params.rpgId, params.userId))
    const values = normalizeTemplateFields(
      params.fields,
      "Campo de caracteristica invalido.",
      "Cada campo de caracteristica precisa ter nome com pelo menos 2 caracteres.",
      "campo-caracteristica",
    )
    await repository.replaceCharacteristicTemplates(params.rpgId, values)
    return { message: "Campos de caracteristicas atualizados." }
  } catch (error) {
    wrapCharacteristicError(error, "Erro interno ao salvar campos de caracteristicas.")
  }
}
