import type { JSONContent } from "@tiptap/react"

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
  content: JSONContent
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
  players: RpgUserOptionDto[]
  races: RaceOptionDto[]
  classes: ClassOptionDto[]
}
