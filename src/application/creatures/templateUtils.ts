import slugify from "@/utils/slugify"
import type { CharacterEditorSummaryDto } from "@/application/characters/editor"
import type { CreatureTemplateCategoryDto, CreatureTemplateFieldDto } from "@/application/creatures/types"

export type CreatureAttributeRow = {
  id: string
  categoryKey: string
  fieldKey: string
  value: string
}

export type CreatureGroupedValues = {
  categoryKey: string
  categoryLabel: string
  items: Array<{ key: string; label: string; value: string }>
}

export function createUniqueCreatureTemplateKey(
  label: string,
  usedKeys: Iterable<string>,
  fallback: string,
) {
  const used = new Set(usedKeys)
  const base = slugify(label) || fallback
  let key = base
  let suffix = 2

  while (used.has(key)) {
    key = `${base}-${suffix}`
    suffix += 1
  }

  return key
}

export function createCreatureTemplateCategory(
  categories: CreatureTemplateCategoryDto[],
  label: string,
) {
  const categoryKey = createUniqueCreatureTemplateKey(
    label,
    categories.map((category) => category.key),
    `categoria-${categories.length + 1}`,
  )

  return {
    categoryKey,
    categories: [
      ...categories,
      {
        id: categoryKey,
        key: categoryKey,
        label,
        position: categories.length,
        fields: [],
      },
    ],
  }
}

export function createCreatureTemplateField(
  categories: CreatureTemplateCategoryDto[],
  categoryKey: string,
  label: string,
  fieldType: CreatureTemplateFieldDto["fieldType"] = "text",
) {
  const selectedCategory = categories.find((category) => category.key === categoryKey)
  const fieldKey = createUniqueCreatureTemplateKey(
    label,
    selectedCategory?.fields.map((field) => field.key) ?? [],
    `atributo-${(selectedCategory?.fields.length ?? 0) + 1}`,
  )

  return {
    fieldKey,
    categories: categories.map((category) =>
      category.key !== categoryKey
        ? category
        : {
            ...category,
            fields: [
              ...category.fields,
              {
                id: fieldKey,
                key: fieldKey,
                label,
                fieldType,
                position: category.fields.length,
              },
            ],
          },
    ),
  }
}

export function updateCreatureTemplateField(
  categories: CreatureTemplateCategoryDto[],
  params: {
    categoryKey: string
    fieldId: string
    label: string
    fieldType: CreatureTemplateFieldDto["fieldType"]
  },
) {
  return categories.map((category) =>
    category.key !== params.categoryKey
      ? category
      : {
          ...category,
          fields: category.fields.map((field) =>
            field.id !== params.fieldId
              ? field
              : { ...field, label: params.label, fieldType: params.fieldType },
          ),
        },
  )
}

export function getCreatureTemplateRowId(categoryKey: string, fieldKey: string) {
  return `template-${categoryKey}-${fieldKey}`
}

export function findCreatureTemplateRow(
  rows: CreatureAttributeRow[],
  categoryKey: string,
  fieldKey: string,
) {
  return rows.find((row) => row.categoryKey === categoryKey && slugify(row.fieldKey) === fieldKey)
}

export function buildCreatureRowsFromTemplates(
  templateCategories: CreatureTemplateCategoryDto[],
  existingRows: CreatureAttributeRow[],
) {
  const templateRows = templateCategories.flatMap((category) =>
    category.fields.map((field) => {
      const existingRow = findCreatureTemplateRow(existingRows, category.key, field.key)
      return {
        id: existingRow?.id ?? getCreatureTemplateRowId(category.key, field.key),
        categoryKey: category.key,
        fieldKey: field.key,
        value: existingRow?.value ?? "",
      }
    }),
  )
  const templateKeys = new Set(templateRows.map((row) => `${row.categoryKey}:${slugify(row.fieldKey)}`))
  const unmatchedRows = existingRows.filter(
    (row) => !templateKeys.has(`${row.categoryKey}:${slugify(row.fieldKey)}`),
  )

  return [...templateRows, ...unmatchedRows]
}

export function buildCreatureIdentityKey(categoryKey: string, fieldKey: string) {
  return `${categoryKey}::${fieldKey}`
}

export function parseCreatureIdentityKey(compoundKey: string) {
  const [categoryKey, fieldKey] = compoundKey.split("::")
  return {
    categoryKey: categoryKey?.trim() ?? "",
    fieldKey: fieldKey?.trim() ?? "",
  }
}

export function buildEmptyNumericRecord(items: Array<{ key: string }>) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item.key] = 0
    return acc
  }, {})
}

export function buildCreatureRowsFromCharacter(
  character?: CharacterEditorSummaryDto | null,
): CreatureAttributeRow[] {
  if (!character?.identity) {
    return []
  }

  return Object.entries(character.identity)
    .map(([compoundKey, value], index) => {
      const parsed = parseCreatureIdentityKey(compoundKey)
      if (!parsed.categoryKey || !parsed.fieldKey || typeof value !== "string") {
        return null
      }

      return {
        id: `${compoundKey}-${index}`,
        categoryKey: parsed.categoryKey,
        fieldKey: parsed.fieldKey,
        value,
      }
    })
    .filter((row): row is CreatureAttributeRow => Boolean(row))
}

export function buildCreatureIdentityPayload(rows: CreatureAttributeRow[]) {
  return rows.reduce<Record<string, string>>((acc, row) => {
    const categoryKey = row.categoryKey.trim()
    const fieldKey = slugify(row.fieldKey.trim())
    const value = row.value.trim()

    if (!categoryKey || !fieldKey || !value) {
      return acc
    }

    acc[buildCreatureIdentityKey(categoryKey, fieldKey)] = value
    return acc
  }, {})
}

export function groupCreatureIdentity(
  rows: CreatureAttributeRow[],
  categories: CreatureTemplateCategoryDto[],
): CreatureGroupedValues[] {
  const categoryMap = new Map(categories.map((category) => [category.key, category]))
  const grouped = new Map<string, CreatureGroupedValues>()

  for (const row of rows) {
    const trimmedValue = row.value.trim()
    if (!row.categoryKey || !row.fieldKey || !trimmedValue) {
      continue
    }

    const category = categoryMap.get(row.categoryKey)
    const field = category?.fields.find((item) => item.key === slugify(row.fieldKey))
    const group = grouped.get(row.categoryKey) ?? {
      categoryKey: row.categoryKey,
      categoryLabel: category?.label ?? row.categoryKey,
      items: [],
    }

    group.items.push({
      key: slugify(row.fieldKey),
      label: field?.label ?? row.fieldKey,
      value: trimmedValue,
    })

    grouped.set(row.categoryKey, group)
  }

  return Array.from(grouped.values()).sort((left, right) =>
    left.categoryLabel.localeCompare(right.categoryLabel, "pt-BR"),
  )
}
