export type LibraryDocumentNode = {
  type?: string
  attrs?: Record<string, unknown>
  content?: LibraryDocumentNode[]
  marks?: Array<{
    type: string
    attrs?: Record<string, unknown>
  }>
  text?: string
  [key: string]: unknown
}

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
  content: LibraryDocumentNode
  canEdit?: boolean
  createdByUserId?: string | null
  visibility: "private" | "public" | "unlisted"
  allowedCharacterIds: string[]
  allowedClassKeys: string[]
  allowedRaceKeys: string[]
  createdAt: string
  updatedAt: string
}

export type RpgUserOptionDto = {
  id: string
  username: string
  name: string
}

export type RaceOptionDto = {
  key: string
  label: string
}

export type ClassOptionDto = {
  key: string
  label: string
}

export type UpsertLibrarySectionPayloadDto = {
  title: string
  description: string | null
  visibility: "private" | "public"
}

export type UpsertLibraryBookPayloadDto = {
  title: string
  description: string | null
  content: LibraryDocumentNode
  visibility: "private" | "public" | "unlisted"
  allowedCharacterIds: string[]
  allowedClassKeys: string[]
  allowedRaceKeys: string[]
}

export type LibrarySectionsViewDto = {
  sections: LibrarySectionDto[]
  canManage: boolean
}

export type LibrarySectionBooksViewDto = {
  section: LibrarySectionDto
  books: LibraryBookDto[]
  canManage: boolean
  canCreate: boolean
  players: RpgUserOptionDto[]
  races: RaceOptionDto[]
  classes: ClassOptionDto[]
}
