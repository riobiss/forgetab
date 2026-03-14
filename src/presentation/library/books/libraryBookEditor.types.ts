import type { JSONContent } from "@tiptap/react"

export const EMPTY_LIBRARY_BOOK_DOC: JSONContent = { type: "doc", content: [] }
export const DEFAULT_LIBRARY_BOOK_TITLE = "Novo livro"
export const LIBRARY_BOOK_DRAFT_STORAGE_PREFIX = "forgetab:library-book-draft"

export type LibraryBookVisibility = "private" | "public" | "unlisted"

export type LibraryBookDraft = {
  title: string
  description: string
  visibility: LibraryBookVisibility
  allowedCharacterIds: string[]
  allowedClassKeys: string[]
  allowedRaceKeys: string[]
  content: JSONContent
}

export type LibraryBookMetadata = Omit<LibraryBookDraft, "content">
