import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { createLibraryBookSchema } from "@/lib/validators/library"
import {
  getRpgVisibilityAccess,
  getUserIdFromRequestToken,
} from "@/lib/server/rpgLibraryAccess"

type RouteContext = {
  params: Promise<{
    rpgId: string
    sectionId: string
  }>
}

type LibraryBookRow = {
  id: string
  rpgId: string
  sectionId: string
  createdByUserId: string | null
  title: string
  description: string | null
  content: Prisma.JsonValue
  visibility: "private" | "public"
  allowedCharacterIds: Prisma.JsonValue
  allowedClassKeys: Prisma.JsonValue
  allowedRaceKeys: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

type SectionExistenceRow = {
  id: string
}

type ViewerCharacterRow = {
  id: string
  classKey: string | null
  raceKey: string | null
}

const EMPTY_DOC = { type: "doc", content: [] as unknown[] }

function normalizeTextList(input: string[]) {
  return input.map((value) => value.trim()).filter((value) => value.length > 0)
}

function parseStringList(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

async function getViewerCharacters(rpgId: string, userId: string) {
  try {
    return await prisma.$queryRaw<ViewerCharacterRow[]>(Prisma.sql`
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
}

function canViewLibraryBook(
  book: LibraryBookRow,
  userId: string,
  canManage: boolean,
  viewerCharacters: ViewerCharacterRow[],
) {
  if (canManage) return true
  if (book.createdByUserId === userId) return true
  if (book.visibility === "public") return true

  const allowedUsersOrCharacterIds = new Set(parseStringList(book.allowedCharacterIds))
  const allowedClassKeys = new Set(parseStringList(book.allowedClassKeys))
  const allowedRaceKeys = new Set(parseStringList(book.allowedRaceKeys))

  if (
    allowedUsersOrCharacterIds.size === 0 &&
    allowedClassKeys.size === 0 &&
    allowedRaceKeys.size === 0
  ) {
    return false
  }

  if (allowedUsersOrCharacterIds.has(userId)) {
    return true
  }

  for (const character of viewerCharacters) {
    if (allowedUsersOrCharacterIds.has(character.id)) {
      return true
    }

    if (character.classKey && allowedClassKeys.has(character.classKey)) {
      return true
    }

    if (character.raceKey && allowedRaceKeys.has(character.raceKey)) {
      return true
    }
  }

  return false
}

async function sectionExists(rpgId: string, sectionId: string) {
  const rows = await prisma.$queryRaw<SectionExistenceRow[]>(Prisma.sql`
    SELECT id
    FROM rpg_library_sections
    WHERE id = ${sectionId}
      AND rpg_id = ${rpgId}
    LIMIT 1
  `)

  return Boolean(rows[0])
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, sectionId } = await context.params
    const access = await getRpgVisibilityAccess(rpgId, userId)
    if (!access.exists || !access.canView) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    if (!(await sectionExists(rpgId, sectionId))) {
      return NextResponse.json({ message: "Secao nao encontrada." }, { status: 404 })
    }

    const books = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
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

    const viewerCharacters = access.canManage
      ? []
      : await getViewerCharacters(rpgId, userId)
    const booksWithPermissions = books
      .filter((book) => canViewLibraryBook(book, userId, access.canManage, viewerCharacters))
      .map((book) => ({
      ...book,
      canEdit: book.createdByUserId === userId,
      }))

    return NextResponse.json(
      { books: booksWithPermissions, canManage: access.canManage },
      { status: 200 },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('relation "rpg_library_books" does not exist') ||
        error.message.includes('column "created_by_user_id" does not exist') ||
        error.message.includes('column "description" does not exist') ||
        error.message.includes('column "visibility" does not exist') ||
        error.message.includes('column "allowed_character_ids" does not exist') ||
        error.message.includes('column "allowed_class_keys" does not exist') ||
        error.message.includes('column "allowed_race_keys" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao listar livros." }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, sectionId } = await context.params
    const access = await getRpgVisibilityAccess(rpgId, userId)
    if (!access.exists) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }
    if (!access.canManage) {
      return NextResponse.json({ message: "Voce nao pode editar a biblioteca deste RPG." }, { status: 403 })
    }

    if (!(await sectionExists(rpgId, sectionId))) {
      return NextResponse.json({ message: "Secao nao encontrada." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createLibraryBookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const created = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
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
        ${rpgId},
        ${sectionId},
        ${userId},
        ${parsed.data.title.trim()},
        ${parsed.data.description?.trim() ? parsed.data.description.trim() : null},
        ${JSON.stringify(parsed.data.content ?? EMPTY_DOC)}::jsonb,
        ${parsed.data.visibility}::"public"."RpgVisibility",
        ${JSON.stringify(normalizeTextList(parsed.data.allowedCharacterIds))}::jsonb,
        ${JSON.stringify(normalizeTextList(parsed.data.allowedClassKeys))}::jsonb,
        ${JSON.stringify(normalizeTextList(parsed.data.allowedRaceKeys))}::jsonb
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

    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_library_sections
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sectionId}
    `)

    return NextResponse.json({ book: created[0] }, { status: 201 })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('relation "rpg_library_books" does not exist') ||
        error.message.includes('column "created_by_user_id" does not exist') ||
        error.message.includes('column "description" does not exist') ||
        error.message.includes('column "visibility" does not exist') ||
        error.message.includes('column "allowed_character_ids" does not exist') ||
        error.message.includes('column "allowed_class_keys" does not exist') ||
        error.message.includes('column "allowed_race_keys" does not exist'))
    ) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao criar livro." }, { status: 500 })
  }
}
