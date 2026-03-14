import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import type { LibraryRepository, ViewerCharacter } from "@/application/library/ports/LibraryRepository"
import type { LibraryBookDto, LibrarySectionDto } from "@/application/library/types"

type LibrarySectionRow = {
  id: string
  rpgId: string
  createdByUserId: string | null
  title: string
  description: string | null
  visibility: "private" | "public"
  createdAt: Date
  updatedAt: Date
  booksCount: number
}

type LibraryBookRow = {
  id: string
  rpgId: string
  sectionId: string
  createdByUserId: string | null
  title: string
  description: string | null
  content: Prisma.JsonValue
  visibility: "private" | "public" | "unlisted"
  allowedCharacterIds: Prisma.JsonValue
  allowedClassKeys: Prisma.JsonValue
  allowedRaceKeys: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

function toIsoString(value: Date | string | null | undefined) {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string") return value
  return ""
}

function mapSection(row: LibrarySectionRow): LibrarySectionDto {
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

function parseStringList(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === "string")
}

function mapBook(row: LibraryBookRow): LibraryBookDto {
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

export const prismaLibraryRepository: LibraryRepository = {
  async listSections(rpgId) {
    const rows = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      SELECT
        s.id,
        s.rpg_id AS "rpgId",
        s.created_by_user_id AS "createdByUserId",
        s.title,
        s.description,
        s.visibility,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        COUNT(b.id)::int AS "booksCount"
      FROM rpg_library_sections s
      LEFT JOIN rpg_library_books b ON b.section_id = s.id
      WHERE s.rpg_id = ${rpgId}
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `)
    return rows.map(mapSection)
  },

  async findSection(rpgId, sectionId) {
    const rows = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        visibility,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        (
          SELECT COUNT(*)
          FROM rpg_library_books b
          WHERE b.section_id = rpg_library_sections.id
        )::int AS "booksCount"
      FROM rpg_library_sections
      WHERE id = ${sectionId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
    return rows[0] ? mapSection(rows[0]) : null
  },

  async createSection(params) {
    const rows = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      INSERT INTO rpg_library_sections (id, rpg_id, created_by_user_id, title, description, visibility)
      VALUES (
        ${crypto.randomUUID()},
        ${params.rpgId},
        ${params.userId},
        ${params.title},
        ${params.description},
        ${params.visibility}::"public"."RpgVisibility"
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        visibility,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        0::int AS "booksCount"
    `)
    return mapSection(rows[0])
  },

  async updateSection(params) {
    const rows = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      UPDATE rpg_library_sections
      SET
        title = ${params.title},
        description = ${params.description},
        visibility = ${params.visibility}::"public"."RpgVisibility",
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.sectionId}
        AND rpg_id = ${params.rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        visibility,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        (
          SELECT COUNT(*)
          FROM rpg_library_books b
          WHERE b.section_id = rpg_library_sections.id
        )::int AS "booksCount"
    `)
    return rows[0] ? mapSection(rows[0]) : null
  },

  async deleteSection(rpgId, sectionId) {
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      DELETE FROM rpg_library_sections
      WHERE id = ${sectionId}
        AND rpg_id = ${rpgId}
      RETURNING id
    `)
    return Boolean(rows[0])
  },

  async findSectionOwner(params) {
    const rows = await prisma.$queryRaw<Array<{ createdByUserId: string | null }>>(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_library_sections
      WHERE id = ${params.sectionId}
        AND rpg_id = ${params.rpgId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },

  async sectionExists(rpgId, sectionId) {
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id
      FROM rpg_library_sections
      WHERE id = ${sectionId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
    return Boolean(rows[0])
  },

  async listBooks(rpgId, sectionId) {
    const rows = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        section_id AS "sectionId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        content,
        visibility,
        allowed_character_ids AS "allowedCharacterIds",
        allowed_class_keys AS "allowedClassKeys",
        allowed_race_keys AS "allowedRaceKeys",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM rpg_library_books
      WHERE rpg_id = ${rpgId}
        AND section_id = ${sectionId}
      ORDER BY updated_at DESC
    `)
    return rows.map(mapBook)
  },

  async findBook(rpgId, bookId) {
    const rows = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        section_id AS "sectionId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        content,
        visibility,
        allowed_character_ids AS "allowedCharacterIds",
        allowed_class_keys AS "allowedClassKeys",
        allowed_race_keys AS "allowedRaceKeys",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM rpg_library_books
      WHERE id = ${bookId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
    return rows[0] ? mapBook(rows[0]) : null
  },

  async findBookOwner(params) {
    const rows = await prisma.$queryRaw<Array<{ createdByUserId: string | null }>>(Prisma.sql`
      SELECT created_by_user_id AS "createdByUserId"
      FROM rpg_library_books
      WHERE id = ${params.bookId}
        AND rpg_id = ${params.rpgId}
      LIMIT 1
    `)
    return rows[0] ?? null
  },

  async createBook(params) {
    const rows = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
      INSERT INTO rpg_library_books (
        id,
        rpg_id,
        section_id,
        created_by_user_id,
        title,
        description,
        content,
        visibility,
        allowed_character_ids,
        allowed_class_keys,
        allowed_race_keys
      )
      VALUES (
        ${crypto.randomUUID()},
        ${params.rpgId},
        ${params.sectionId},
        ${params.userId},
        ${params.title},
        ${params.description},
        ${params.content}::jsonb,
        ${params.visibility}::"public"."RpgVisibility",
        ${JSON.stringify(params.allowedCharacterIds)}::jsonb,
        ${JSON.stringify(params.allowedClassKeys)}::jsonb,
        ${JSON.stringify(params.allowedRaceKeys)}::jsonb
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        section_id AS "sectionId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        content,
        visibility,
        allowed_character_ids AS "allowedCharacterIds",
        allowed_class_keys AS "allowedClassKeys",
        allowed_race_keys AS "allowedRaceKeys",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)
    return mapBook(rows[0])
  },

  async updateBook(params) {
    const rows = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
      UPDATE rpg_library_books
      SET
        title = ${params.title},
        description = ${params.description},
        content = ${params.content}::jsonb,
        visibility = ${params.visibility}::"public"."RpgVisibility",
        allowed_character_ids = ${JSON.stringify(params.allowedCharacterIds)}::jsonb,
        allowed_class_keys = ${JSON.stringify(params.allowedClassKeys)}::jsonb,
        allowed_race_keys = ${JSON.stringify(params.allowedRaceKeys)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.bookId}
        AND rpg_id = ${params.rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        section_id AS "sectionId",
        created_by_user_id AS "createdByUserId",
        title,
        description,
        content,
        visibility,
        allowed_character_ids AS "allowedCharacterIds",
        allowed_class_keys AS "allowedClassKeys",
        allowed_race_keys AS "allowedRaceKeys",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)
    return rows[0] ? mapBook(rows[0]) : null
  },

  async deleteBook(rpgId, bookId) {
    const rows = await prisma.$queryRaw<{ id: string; sectionId: string }[]>(Prisma.sql`
      DELETE FROM rpg_library_books
      WHERE id = ${bookId}
        AND rpg_id = ${rpgId}
      RETURNING id, section_id AS "sectionId"
    `)
    return rows[0] ?? null
  },

  async touchSection(sectionId) {
    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_library_sections
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sectionId}
    `)
  },

  async getViewerCharacters(rpgId, userId) {
    try {
      return await prisma.$queryRaw<ViewerCharacter[]>(Prisma.sql`
        SELECT
          id,
          class_key AS "classKey",
          race_key AS "raceKey"
        FROM rpg_characters
        WHERE rpg_id = ${rpgId}
          AND created_by_user_id = ${userId}
      `)
    } catch {
      return []
    }
  },
}
