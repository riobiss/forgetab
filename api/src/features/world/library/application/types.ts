export type JsonContentNode = {
  type?: string
  attrs?: Record<string, unknown>
  content?: JsonContentNode[]
  marks?: Array<{
    type: string
    attrs?: Record<string, unknown>
  }>
  text?: string
  [key: string]: unknown
}

export type JSONContent = JsonContentNode

export type LibrarySectionDto = {
  id: string
  rpgId: string
  createdByUserId?: string | null
  title: string
  description: string | null
  visibility: "private" | "public"
  canEdit?: boolean
  canDelete?: boolean
  booksCount?: number
  createdAt: string
  updatedAt: string
}

export type LibraryBookDto = {
  id: string
  rpgId: string
  sectionId: string
  title: string
  description: string | null
  content: JSONContent
  canEdit?: boolean
  createdByUserId?: string | null
  visibility: "private" | "public" | "unlisted"
  allowedCharacterIds: string[]
  allowedClassKeys: string[]
  allowedRaceKeys: string[]
  createdAt: string
  updatedAt: string
}
