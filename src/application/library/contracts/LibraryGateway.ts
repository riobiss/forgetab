import type {
  ClassOptionDto,
  LibraryBookDto,
  LibrarySectionDto,
  RaceOptionDto,
  RpgUserOptionDto,
  UpsertLibraryBookPayloadDto,
  UpsertLibrarySectionPayloadDto,
} from "@/application/library/types"

export interface LibraryGateway {
  fetchSections(rpgId: string): Promise<LibrarySectionsViewDto>
  createSection(rpgId: string, payload: UpsertLibrarySectionPayloadDto): Promise<LibrarySectionDto>
  updateSection(
    rpgId: string,
    sectionId: string,
    payload: UpsertLibrarySectionPayloadDto,
  ): Promise<LibrarySectionDto>
  deleteSection(rpgId: string, sectionId: string): Promise<void>
  fetchSection(rpgId: string, sectionId: string): Promise<{ section: LibrarySectionDto; canManage: boolean }>
  fetchSectionBooks(rpgId: string, sectionId: string): Promise<{ books: LibraryBookDto[]; canManage: boolean }>
  fetchVisibilityOptions(
    rpgId: string,
  ): Promise<{ players: RpgUserOptionDto[]; races: RaceOptionDto[]; classes: ClassOptionDto[] }>
  fetchBook(rpgId: string, bookId: string): Promise<{ book: LibraryBookDto; canEdit: boolean; canManage: boolean }>
  createBook(
    rpgId: string,
    sectionId: string,
    payload: UpsertLibraryBookPayloadDto,
  ): Promise<LibraryBookDto>
  updateBook(
    rpgId: string,
    bookId: string,
    payload: UpsertLibraryBookPayloadDto,
  ): Promise<LibraryBookDto>
  deleteBook(rpgId: string, bookId: string): Promise<void>
  uploadLibraryImage(file: File): Promise<{ url: string }>
}
