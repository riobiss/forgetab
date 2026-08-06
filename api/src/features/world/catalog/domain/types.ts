export type CatalogEntityType = "class" | "race"

export type CatalogRichTextField =
  "description" | "origin" | "kingdoms" | "lore" | "notes"

export type RichTextDocument = {
  type: "doc"
  content?: Array<Record<string, unknown>>
  [key: string]: unknown
}

export type CatalogRichTextMap = Partial<
  Record<CatalogRichTextField, RichTextDocument | null>
>

export type EntityCatalogMeta = {
  shortDescription: string | null
  richText: CatalogRichTextMap
}
