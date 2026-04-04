import type { Prisma } from "../../../../generated/prisma/client.js"
import type { LibraryBookDto, LibrarySectionDto } from "@/application/library/types"

export type ViewerCharacter = {
  id: string
  classKey: string | null
  raceKey: string | null
}

export interface LibraryRepository {
  listSections(rpgId: string): Promise<LibrarySectionDto[]>
  findSection(rpgId: string, sectionId: string): Promise<LibrarySectionDto | null>
  createSection(params: {
    rpgId: string
    userId: string
    title: string
    description: string | null
    visibility: "private" | "public"
  }): Promise<LibrarySectionDto>
  updateSection(params: {
    rpgId: string
    sectionId: string
    title: string
    description: string | null
    visibility: "private" | "public"
  }): Promise<LibrarySectionDto | null>
  findSectionOwner(params: {
    rpgId: string
    sectionId: string
  }): Promise<{ createdByUserId: string | null } | null>
  deleteSection(rpgId: string, sectionId: string): Promise<boolean>
  sectionExists(rpgId: string, sectionId: string): Promise<boolean>
  listBooks(rpgId: string, sectionId: string): Promise<LibraryBookDto[]>
  findBook(rpgId: string, bookId: string): Promise<LibraryBookDto | null>
  findBookOwner(params: {
    rpgId: string
    bookId: string
  }): Promise<{ createdByUserId: string | null } | null>
  createBook(params: {
    rpgId: string
    sectionId: string
    userId: string
    title: string
    description: string | null
    content: Prisma.JsonValue
    visibility: "private" | "public" | "unlisted"
    allowedCharacterIds: string[]
    allowedClassKeys: string[]
    allowedRaceKeys: string[]
  }): Promise<LibraryBookDto>
  updateBook(params: {
    rpgId: string
    bookId: string
    title: string
    description: string | null
    content: Prisma.JsonValue
    visibility: "private" | "public" | "unlisted"
    allowedCharacterIds: string[]
    allowedClassKeys: string[]
    allowedRaceKeys: string[]
  }): Promise<LibraryBookDto | null>
  deleteBook(rpgId: string, bookId: string): Promise<{ id: string; sectionId: string } | null>
  touchSection(sectionId: string): Promise<void>
  getViewerCharacters(rpgId: string, userId: string): Promise<ViewerCharacter[]>
}
