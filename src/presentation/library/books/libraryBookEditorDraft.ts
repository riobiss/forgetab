import type { LibraryBookDraft } from "./libraryBookEditor.types"
import {
  DEFAULT_LIBRARY_BOOK_TITLE,
  EMPTY_LIBRARY_BOOK_DOC,
  LIBRARY_BOOK_DRAFT_STORAGE_PREFIX,
} from "./libraryBookEditor.types"

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export function createLibraryBookDraftSnapshot(input: LibraryBookDraft): LibraryBookDraft {
  return {
    title: input.title,
    description: input.description,
    visibility: input.visibility,
    allowedCharacterIds: input.allowedCharacterIds,
    allowedClassKeys: input.allowedClassKeys,
    allowedRaceKeys: input.allowedRaceKeys,
    content: input.content,
  }
}

export function serializeLibraryBookDraft(snapshot: LibraryBookDraft) {
  return JSON.stringify(snapshot)
}

export function parseLibraryBookDraft(raw: string | null): LibraryBookDraft | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<LibraryBookDraft> | null
    if (!parsed || typeof parsed !== "object") return null

    const title = typeof parsed.title === "string" ? parsed.title : DEFAULT_LIBRARY_BOOK_TITLE
    const description = typeof parsed.description === "string" ? parsed.description : ""
    const visibility =
      parsed.visibility === "public" || parsed.visibility === "unlisted"
        ? parsed.visibility
        : "private"
    const content =
      parsed.content && typeof parsed.content === "object" && !Array.isArray(parsed.content)
        ? parsed.content
        : EMPTY_LIBRARY_BOOK_DOC

    return {
      title,
      description,
      visibility,
      allowedCharacterIds: normalizeStringArray(parsed.allowedCharacterIds),
      allowedClassKeys: normalizeStringArray(parsed.allowedClassKeys),
      allowedRaceKeys: normalizeStringArray(parsed.allowedRaceKeys),
      content,
    }
  } catch {
    return null
  }
}

export function buildLibraryBookDraftStorageKey(params: {
  rpgId: string
  sectionId: string
  bookId?: string
}) {
  return `${LIBRARY_BOOK_DRAFT_STORAGE_PREFIX}:${params.rpgId}:${params.sectionId}:${params.bookId ?? "new"}`
}

export function createDefaultLibraryBookDraft(): LibraryBookDraft {
  return createLibraryBookDraftSnapshot({
    title: DEFAULT_LIBRARY_BOOK_TITLE,
    description: "",
    visibility: "private",
    allowedCharacterIds: [],
    allowedClassKeys: [],
    allowedRaceKeys: [],
    content: EMPTY_LIBRARY_BOOK_DOC,
  })
}
