import type { Prisma } from "../../../../generated/prisma/client.js"
import type { LibraryBookDto, LibrarySectionDto } from "@/application/library/types"
import type {
  LibraryBookRow,
  LibrarySectionRow,
} from "@/infrastructure/library/repositories/libraryRepositoryRows"

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return ""
}

function parseStringList(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string")
}

export function mapSection(row: LibrarySectionRow): LibrarySectionDto {
  return {
    id: row.id,
    rpgId: row.rpgId,
    createdByUserId: row.createdByUserId,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    booksCount: row.booksCount,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}

export function mapBook(row: LibraryBookRow): LibraryBookDto {
  return {
    id: row.id,
    rpgId: row.rpgId,
    sectionId: row.sectionId,
    createdByUserId: row.createdByUserId,
    title: row.title,
    description: row.description,
    content: (row.content ?? { type: "doc", content: [] }) as LibraryBookDto["content"],
    visibility: row.visibility,
    allowedCharacterIds: parseStringList(row.allowedCharacterIds),
    allowedClassKeys: parseStringList(row.allowedClassKeys),
    allowedRaceKeys: parseStringList(row.allowedRaceKeys),
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
  }
}
