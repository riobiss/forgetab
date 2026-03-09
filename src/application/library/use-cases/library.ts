import type { LibraryDependencies } from "@/application/library/contracts/LibraryDependencies"
import type {
  UpsertLibraryBookPayloadDto,
  UpsertLibrarySectionPayloadDto,
} from "@/application/library/types"

type Dependencies = LibraryDependencies

export async function loadLibrarySectionsUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.fetchSections(params.rpgId)
}

export async function createLibrarySectionUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: UpsertLibrarySectionPayloadDto },
) {
  return deps.gateway.createSection(params.rpgId, params.payload)
}

export async function updateLibrarySectionUseCase(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; payload: UpsertLibrarySectionPayloadDto },
) {
  return deps.gateway.updateSection(params.rpgId, params.sectionId, params.payload)
}

export async function deleteLibrarySectionUseCase(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string },
) {
  return deps.gateway.deleteSection(params.rpgId, params.sectionId)
}

export async function loadLibrarySectionBooksUseCase(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string },
) {
  const [sectionPayload, booksPayload, optionsPayload] = await Promise.all([
    deps.gateway.fetchSection(params.rpgId, params.sectionId),
    deps.gateway.fetchSectionBooks(params.rpgId, params.sectionId),
    deps.gateway.fetchVisibilityOptions(params.rpgId),
  ])

  return {
    section: sectionPayload.section,
    canManage: booksPayload.canManage || sectionPayload.canManage,
    books: booksPayload.books,
    players: optionsPayload.players,
    races: optionsPayload.races,
    classes: optionsPayload.classes,
  }
}

export async function loadLibraryBookUseCase(
  deps: Dependencies,
  params: { rpgId: string; bookId: string },
) {
  return deps.gateway.fetchBook(params.rpgId, params.bookId)
}

export async function createLibraryBookUseCase(
  deps: Dependencies,
  params: { rpgId: string; sectionId: string; payload: UpsertLibraryBookPayloadDto },
) {
  return deps.gateway.createBook(params.rpgId, params.sectionId, params.payload)
}

export async function updateLibraryBookUseCase(
  deps: Dependencies,
  params: { rpgId: string; bookId: string; payload: UpsertLibraryBookPayloadDto },
) {
  return deps.gateway.updateBook(params.rpgId, params.bookId, params.payload)
}

export async function deleteLibraryBookUseCase(
  deps: Dependencies,
  params: { rpgId: string; bookId: string },
) {
  return deps.gateway.deleteBook(params.rpgId, params.bookId)
}

export async function uploadLibraryImageUseCase(
  deps: Dependencies,
  params: { file: File },
) {
  return deps.gateway.uploadLibraryImage(params.file)
}
