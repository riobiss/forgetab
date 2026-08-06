import {
  createBaseItemSchema,
  type CreateBaseItemInput
} from "@/lib/validators/baseItem"
import type {
  NormalizedCustomField,
  NormalizedBaseItemInput,
  NormalizedNamedDescription
} from "@/features/world/item/application/ports/ItemRepository"
import { ItemRepositoryError } from "@/features/world/item/application/errors/ItemRepositoryError"
import { AppError } from "@/features/shared/application/errors/AppError"

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNamedEntries(
  entries: CreateBaseItemInput["abilities"] | CreateBaseItemInput["effects"]
) {
  return (entries ?? [])
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim()
    }))
    .filter(
      (entry): entry is NormalizedNamedDescription =>
        entry.description.length > 0
    )
}

function normalizeCustomFields(entries: CreateBaseItemInput["customFields"]) {
  return (entries ?? [])
    .map((entry) => ({
      name: entry.name.trim(),
      value: normalizeOptionalText(entry.value)
    }))
    .filter((entry): entry is NormalizedCustomField => entry.name.length > 0)
}

export function parseAndNormalizeBaseItem(
  body: unknown
): NormalizedBaseItemInput {
  const parsed = createBaseItemSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400
    )
  }

  const damage = normalizeOptionalText(parsed.data.damage)
  const image = normalizeOptionalText(parsed.data.image)
  const range = normalizeOptionalText(parsed.data.range)
  const description = normalizeOptionalText(parsed.data.description)
  const preRequirement = normalizeOptionalText(parsed.data.preRequirement)
  const weight = parsed.data.weight ?? null
  const duration = normalizeOptionalText(parsed.data.duration)
  const durability = parsed.data.durability ?? null
  const abilities = normalizeNamedEntries(parsed.data.abilities)
  const effects = normalizeNamedEntries(parsed.data.effects)
  const customFields = normalizeCustomFields(parsed.data.customFields)
  const abilityName =
    normalizeOptionalText(parsed.data.abilityName) ?? abilities[0]?.name ?? null
  const ability =
    normalizeOptionalText(parsed.data.ability) ??
    abilities[0]?.description ??
    null
  const effectName =
    normalizeOptionalText(parsed.data.effectName) ?? effects[0]?.name ?? null
  const effect =
    normalizeOptionalText(parsed.data.effect) ?? effects[0]?.description ?? null

  return {
    ...parsed.data,
    image,
    description,
    preRequirement,
    damage,
    range,
    ability,
    abilityName,
    effect,
    effectName,
    abilities,
    effects,
    customFields,
    weight,
    duration,
    durability
  }
}

export function ensureCanManageRpg(canManage: boolean) {
  if (!canManage) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

export function mapBaseItemsError(
  error: unknown,
  fallbackMessage: string
): never {
  if (error instanceof AppError) {
    throw error
  }

  if (
    error instanceof ItemRepositoryError &&
    error.code === "inventory_schema_missing"
  ) {
    throw new AppError(
      "Tabela de inventario nao existe no banco. Rode a migration.",
      500
    )
  }

  if (
    error instanceof ItemRepositoryError &&
    error.code === "schema_outdated"
  ) {
    throw new AppError(
      "Estrutura de itens desatualizada. Rode a migration mais recente.",
      500
    )
  }

  throw new AppError(fallbackMessage, 500)
}
