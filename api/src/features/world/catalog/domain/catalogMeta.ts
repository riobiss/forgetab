import type { CatalogRichTextField, CatalogRichTextMap, EntityCatalogMeta, RichTextDocument } from "@/domain/entityCatalog/types"

const RICH_TEXT_FIELDS: CatalogRichTextField[] = [
  "description",
  "origin",
  "kingdoms",
  "lore",
  "notes",
]

export const EMPTY_RICH_TEXT_DOCUMENT: RichTextDocument = {
  type: "doc",
  content: [],
}

export function createRichTextDocumentFromText(value: string): RichTextDocument {
  const text = value.trim()
  if (!text) return EMPTY_RICH_TEXT_DOCUMENT

  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isRichTextDocument(value: unknown): value is RichTextDocument {
  return isRecord(value) && typeof value.type === "string"
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
  const richText = Object.entries(meta.richText).reduce<CatalogRichTextMap>((acc, [field, value]) => {
    if (isRichTextDocument(value)) {
      acc[field as CatalogRichTextField] = value
    }
    return acc
  }, {})

  return {
    shortDescription: meta.shortDescription?.trim() || null,
    richText,
  }
}

export function getRichTextPlainText(value: unknown): string {
  if (!value) return ""
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) {
    return value.map((item) => getRichTextPlainText(item)).filter(Boolean).join(" ").trim()
  }
  if (!isRecord(value)) return ""

  const text = typeof value.text === "string" ? value.text.trim() : ""
  const content = Array.isArray(value.content)
    ? value.content.map((item) => getRichTextPlainText(item)).filter(Boolean).join(" ").trim()
    : ""

  return [text, content].filter(Boolean).join(" ").trim()
}

export function getCatalogMetaSearchText(meta: EntityCatalogMeta) {
  return [
    meta.shortDescription ?? "",
    ...RICH_TEXT_FIELDS.map((field) => getRichTextPlainText(meta.richText[field])),
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
}

export function getCatalogMetaExcerpt(meta: EntityCatalogMeta) {
  if (meta.shortDescription) return meta.shortDescription

  const descriptionText = getRichTextPlainText(meta.richText.description)
  if (descriptionText) {
    return descriptionText.length > 180 ? `${descriptionText.slice(0, 177)}...` : descriptionText
  }

  return null
}
