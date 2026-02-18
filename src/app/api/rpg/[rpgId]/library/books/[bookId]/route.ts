import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { createLibraryBookSchema } from "@/lib/validators/library"
import {
  getRpgVisibilityAccess,
  getUserIdFromRequestToken,
} from "@/lib/server/rpgLibraryAccess"

type RouteContext = {
  params: Promise<{
    rpgId: string
    bookId: string
  }>
}

type LibraryBookRow = {
  id: string
  rpgId: string
  sectionId: string
  title: string
  content: Prisma.JsonValue
  visibility: "private" | "public"
  allowedCharacterIds: Prisma.JsonValue
  allowedClassKeys: Prisma.JsonValue
  allowedRaceKeys: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

type ViewerCharacterRow = {
  id: string
  classKey: string | null
  raceKey: string | null
}

function normalizeTextList(input: string[]) {
  return input.map((value) => value.trim()).filter((value) => value.length > 0)
}

function parseTextListJson(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

async function getViewerCharacters(rpgId: string, userId: string) {
  const rows = await prisma.$queryRaw<ViewerCharacterRow[]>(Prisma.sql`
    SELECT
      id,
      class_key AS "classKey",
      race_key AS "raceKey"
    FROM rpg_characters
    WHERE rpg_id = ${rpgId}
      AND created_by_user_id = ${userId}
      AND character_type = 'player'::"RpgCharacterType"
  `)

  return rows
}

function canUserSeePrivateBook(
  book: LibraryBookRow,
  userId: string,
  viewerCharacters: ViewerCharacterRow[],
) {
  if (book.visibility === "public") return true

  const allowedCharacterIds = new Set(parseTextListJson(book.allowedCharacterIds))
  const allowedClassKeys = new Set(parseTextListJson(book.allowedClassKeys))
  const allowedRaceKeys = new Set(parseTextListJson(book.allowedRaceKeys))

  if (allowedCharacterIds.has(userId)) {
    return true
  }

  if (viewerCharacters.length === 0) return false

  if (allowedCharacterIds.size === 0 && allowedClassKeys.size === 0 && allowedRaceKeys.size === 0) {
    return false
  }

  return viewerCharacters.some((character) => {
    if (allowedCharacterIds.has(character.id)) return true
    if (character.classKey && allowedClassKeys.has(character.classKey)) return true
    if (character.raceKey && allowedRaceKeys.has(character.raceKey)) return true
    return false
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, bookId } = await context.params
    const access = await getRpgVisibilityAccess(rpgId, userId)
    if (!access.exists || !access.canView) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const books = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        section_id AS "sectionId",
        title,
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

    if (books.length === 0) {
      return NextResponse.json({ message: "Livro nao encontrado." }, { status: 404 })
    }

    if (!access.canManage) {
      const viewerCharacters = await getViewerCharacters(rpgId, userId)
      if (!canUserSeePrivateBook(books[0], userId, viewerCharacters)) {
        return NextResponse.json({ message: "Livro nao encontrado." }, { status: 404 })
      }
    }

    return NextResponse.json({ book: books[0], canManage: access.canManage }, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('relation "rpg_library_books" does not exist') ||
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

    return NextResponse.json({ message: "Erro interno ao buscar livro." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, bookId } = await context.params
    const access = await getRpgVisibilityAccess(rpgId, userId)
    if (!access.exists) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }
    if (!access.canManage) {
      return NextResponse.json({ message: "Voce nao pode editar a biblioteca deste RPG." }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createLibraryBookSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const updated = await prisma.$queryRaw<LibraryBookRow[]>(Prisma.sql`
      UPDATE rpg_library_books
      SET
        title = ${parsed.data.title.trim()},
        content = ${JSON.stringify(parsed.data.content)}::jsonb,
        visibility = ${parsed.data.visibility}::"public"."RpgVisibility",
        allowed_character_ids = ${JSON.stringify(normalizeTextList(parsed.data.allowedCharacterIds))}::jsonb,
        allowed_class_keys = ${JSON.stringify(normalizeTextList(parsed.data.allowedClassKeys))}::jsonb,
        allowed_race_keys = ${JSON.stringify(normalizeTextList(parsed.data.allowedRaceKeys))}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${bookId}
        AND rpg_id = ${rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        section_id AS "sectionId",
        title,
        content,
        visibility,
        allowed_character_ids AS "allowedCharacterIds",
        allowed_class_keys AS "allowedClassKeys",
        allowed_race_keys AS "allowedRaceKeys",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    if (updated.length === 0) {
      return NextResponse.json({ message: "Livro nao encontrado." }, { status: 404 })
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_library_sections
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${updated[0].sectionId}
    `)

    return NextResponse.json({ book: updated[0] }, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('relation "rpg_library_books" does not exist') ||
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

    return NextResponse.json({ message: "Erro interno ao atualizar livro." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, bookId } = await context.params
    const access = await getRpgVisibilityAccess(rpgId, userId)
    if (!access.exists) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }
    if (!access.canManage) {
      return NextResponse.json({ message: "Voce nao pode editar a biblioteca deste RPG." }, { status: 403 })
    }

    const deleted = await prisma.$queryRaw<{ id: string; sectionId: string }[]>(Prisma.sql`
      DELETE FROM rpg_library_books
      WHERE id = ${bookId}
        AND rpg_id = ${rpgId}
      RETURNING id, section_id AS "sectionId"
    `)

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Livro nao encontrado." }, { status: 404 })
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_library_sections
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ${deleted[0].sectionId}
    `)

    return NextResponse.json({ message: "Livro removido com sucesso." }, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('relation "rpg_library_books" does not exist') ||
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

    return NextResponse.json({ message: "Erro interno ao remover livro." }, { status: 500 })
  }
}
