import {
  createBaseItemSchema,
  type CreateBaseItemInput,
} from "@/lib/validators/baseItem"
import type {
  NormalizedBaseItemInput,
  NormalizedNamedDescription,
} from "@/application/items/ports/ItemRepository"
import { AppError } from "@/shared/errors/AppError"

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNamedEntries(entries: CreateBaseItemInput["abilities"] | CreateBaseItemInput["effects"]) {
  return (entries ?? [])
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
    }))
    .filter(
      (entry): entry is NormalizedNamedDescription =>
        entry.name.length > 0 && entry.description.length > 0,
    )
}

export function parseAndNormalizeBaseItem(body: unknown): NormalizedBaseItemInput {
  const parsed = createBaseItemSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
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
  const abilityName = normalizeOptionalText(parsed.data.abilityName) ?? abilities[0]?.name ?? null
  const ability = normalizeOptionalText(parsed.data.ability) ?? abilities[0]?.description ?? null
  const effectName = normalizeOptionalText(parsed.data.effectName) ?? effects[0]?.name ?? null
  const effect = normalizeOptionalText(parsed.data.effect) ?? effects[0]?.description ?? null

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
    weight,
    duration,
    durability,
  }
}

export function ensureCanManageRpg(canManage: boolean) {
  if (!canManage) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

export function mapBaseItemsError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) {
    throw error
  }

  if (error instanceof Error && error.message.includes('relation "baseitems" does not exist')) {
    throw new AppError("Tabela baseitems nao existe no banco. Rode a migration.", 500)
  }

  if (
    error instanceof Error &&
    [
      'column "effect_name" does not exist',
      'column "description" does not exist',
      'column "pre_requirement" does not exist',
      'column "duration" does not exist',
      'column "range" does not exist',
      'column "image" does not exist',
    ].some((message) => error.message.includes(message))
  ) {
    throw new AppError("Estrutura de itens desatualizada. Rode a migration mais recente.", 500)
  }

  throw new AppError(fallbackMessage, 500)
}
