import type { Prisma } from "../../../../generated/prisma/client.js"
import { normalizeEntityCatalogMeta } from "@/domain/entityCatalog/catalogMeta"
import type {
  EntityCatalogAbilityPurchaseState,
  EntityCatalogTemplateOption,
} from "@/application/entityCatalog/types"
import type { EntityCatalogDetailSnapshot } from "@/application/entityCatalog/ports/EntityCatalogDetailRepository"
import { parseCharacterAbilities } from "@/infrastructure/characters/abilities/services/characterAbilityCostParser"
import { normalizeRpgVisibility } from "@/infrastructure/shared/normalizeRpgVisibility"
import type {
  DbClassRow,
  DbRaceRow,
} from "@/infrastructure/entityCatalog/repositories/entityCatalogDetailRows"

export function toTemplateOptions(
  rows: Array<{ key: string; label: string }>,
): EntityCatalogTemplateOption[] {
  return rows.map((row) => ({ key: row.key, label: row.label }))
}

export function toBonusRecord(value: Prisma.JsonValue | undefined) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, number>)
    : {}
}

export function toOwnedBySkill(value: Prisma.JsonValue) {
  return parseCharacterAbilities(value).reduce<Record<string, number[]>>((acc, item) => {
    if (!acc[item.skillId]) {
      acc[item.skillId] = []
    }
    if (!acc[item.skillId].includes(item.level)) {
      acc[item.skillId].push(item.level)
    }
    return acc
  }, {})
}

export function hasMissingColumn(error: unknown, columnName: string) {
  return error instanceof Error && error.message.includes(columnName)
}

export function mapClassDetailRow(
  row: DbClassRow,
): EntityCatalogDetailSnapshot {
  const catalogMeta = normalizeEntityCatalogMeta(row.catalogMeta)

  return {
    entityType: "class",
    id: row.id,
    key: row.key,
    ownerId: row.ownerId,
    visibility: normalizeRpgVisibility(row.visibility),
    costsEnabled: row.costsEnabled,
    costResourceName: row.costResourceName,
    current: {
      id: row.id,
      key: row.key,
      label: row.label,
      category: row.category?.trim() || "geral",
      shortDescription: catalogMeta.shortDescription,
      content:
        (catalogMeta.richText.description as Record<string, unknown>) ?? {
          type: "doc",
          content: [],
        },
      attributeBonuses: toBonusRecord(row.attributeBonuses),
      skillBonuses: toBonusRecord(row.skillBonuses),
      catalogMeta,
    },
  }
}

export function mapRaceDetailRow(
  row: DbRaceRow,
): EntityCatalogDetailSnapshot {
  const catalogMeta = normalizeEntityCatalogMeta(row.catalogMeta)

  return {
    entityType: "race",
    id: row.id,
    key: row.key,
    ownerId: row.ownerId,
    visibility: normalizeRpgVisibility(row.visibility),
    costsEnabled: row.costsEnabled,
    costResourceName: row.costResourceName,
    current: {
      id: row.id,
      key: row.key,
      label: row.label,
      category: row.category?.trim() || "geral",
      shortDescription: catalogMeta.shortDescription,
      content:
        (catalogMeta.richText.description as Record<string, unknown>) ?? {
          type: "doc",
          content: [],
        },
      attributeBonuses: toBonusRecord(row.attributeBonuses),
      skillBonuses: toBonusRecord(row.skillBonuses),
      catalogMeta,
      lore: row.lore,
    },
  }
}

export function emptyPurchaseState(params: {
  costsEnabled: boolean
  costResourceName: string
}): EntityCatalogAbilityPurchaseState {
  return {
    characterId: null,
    costsEnabled: params.costsEnabled,
    costResourceName: params.costResourceName,
    initialPoints: 0,
    initialOwnedBySkill: {},
  }
}
