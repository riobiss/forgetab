import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { createLibrarySectionSchema } from "@/lib/validators/library"
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

type LibrarySectionRow = {
  id: string
  rpgId: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  booksCount: number
}

function normalizeDescription(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

async function findSection(rpgId: string, sectionId: string) {
  const rows = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
    SELECT
      id,
      rpg_id AS "rpgId",
      title,
      description,
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

  return rows[0] ?? null
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

    const section = await findSection(rpgId, sectionId)
    if (!section) {
      return NextResponse.json({ message: "Secao nao encontrada." }, { status: 404 })
    }

    return NextResponse.json({ section, canManage: access.canManage }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_library_sections" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar secao." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const body = await request.json()
    const parsed = createLibrarySectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const updated = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      UPDATE rpg_library_sections
      SET
        title = ${parsed.data.title.trim()},
        description = ${normalizeDescription(parsed.data.description)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sectionId}
        AND rpg_id = ${rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        title,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        (
          SELECT COUNT(*)
          FROM rpg_library_books b
          WHERE b.section_id = rpg_library_sections.id
        )::int AS "booksCount"
    `)

    if (updated.length === 0) {
      return NextResponse.json({ message: "Secao nao encontrada." }, { status: 404 })
    }

    return NextResponse.json({ section: updated[0] }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_library_sections" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao atualizar secao." }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const deleted = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      DELETE FROM rpg_library_sections
      WHERE id = ${sectionId}
        AND rpg_id = ${rpgId}
      RETURNING id
    `)

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Secao nao encontrada." }, { status: 404 })
    }

    return NextResponse.json({ message: "Secao removida com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_library_sections" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao remover secao." }, { status: 500 })
  }
}
