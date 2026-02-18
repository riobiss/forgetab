import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { createLibrarySectionSchema } from "@/lib/validators/library"
import {
  getRpgVisibilityAccess,
  getUserIdFromRequestToken,
} from "@/lib/server/rpgLibraryAccess"

type RouteContext = {
  params: Promise<{
    rpgId: string
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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const access = await getRpgVisibilityAccess(rpgId, userId)
    if (!access.exists || !access.canView) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const sections = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      SELECT
        s.id,
        s.rpg_id AS "rpgId",
        s.title,
        s.description,
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        COUNT(b.id)::int AS "booksCount"
      FROM rpg_library_sections s
      LEFT JOIN rpg_library_books b ON b.section_id = s.id
      WHERE s.rpg_id = ${rpgId}
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `)

    return NextResponse.json(
      { sections, canManage: access.canManage },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_library_sections" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao listar secoes." }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequestToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
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

    const created = await prisma.$queryRaw<LibrarySectionRow[]>(Prisma.sql`
      INSERT INTO rpg_library_sections (id, rpg_id, title, description)
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${parsed.data.title.trim()},
        ${normalizeDescription(parsed.data.description)}
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        title,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        0::int AS "booksCount"
    `)

    return NextResponse.json({ section: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_library_sections" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura da biblioteca indisponivel. Rode as migrations mais recentes." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao criar secao." }, { status: 500 })
  }
}
