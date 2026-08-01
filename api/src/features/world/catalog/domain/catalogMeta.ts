import type {
  CatalogRichTextField,
  CatalogRichTextMap,
  EntityCatalogMeta,
  RichTextDocument,
} from "@/features/world/catalog/domain/types"

const RICH_TEXT_FIELDS: CatalogRichTextField[] = [
  "description",
  "origin",
  "kingdoms",
  "lore",
  "notes",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isRichTextDocument(value: unknown): value is RichTextDocument {
  return (
    isRecord(value) &&
    value.type === "doc" &&
    (value.content === undefined || Array.isArray(value.content))
  )
}

function normalizeShortDescription(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

export function normalizeEntityCatalogMeta(value: unknown): EntityCatalogMeta {
  if (!isRecord(value)) {
    return { shortDescription: null, richText: {} }
  }

  const richText: CatalogRichTextMap = {}
  const maybeRichText = isRecord(value.richText) ? value.richText : {}

  for (const field of RICH_TEXT_FIELDS) {
    const current = maybeRichText[field]
    if (isRichTextDocument(current)) {
      richText[field] = current
    }
  }

  return {
    shortDescription: normalizeShortDescription(value.shortDescription),
    richText,
  }
}

export function serializeEntityCatalogMeta(meta: EntityCatalogMeta) {
  const richText = Object.entries(meta.richText).reduce<CatalogRichTextMap>(
    (acc, [field, value]) => {
      if (isRichTextDocument(value)) {
        acc[field as CatalogRichTextField] = value
      }
      return acc
    },
    {},
  )

  return {
    shortDescription: meta.shortDescription?.trim() || null,
    richText,
  }
}
