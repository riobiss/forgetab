import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createBaseItemSchema } from "@/lib/validators/baseItem"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type BaseItemRow = {
  id: string
  rpgId: string
  name: string
  type: string
  rarity: string
  createdAt: Date
  updatedAt: Date
}

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

async function canAccessRpg(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findFirst({
    where: { id: rpgId, ownerId: userId },
    select: { id: true },
  })

  return Boolean(rpg)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const baseItems = await prisma.$queryRaw<BaseItemRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        type,
        rarity,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM baseitems
      WHERE rpg_id = ${rpgId}
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ items: baseItems }, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('relation "baseitems" does not exist')) {
        return NextResponse.json(
          { message: "Tabela baseitems nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao listar itens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createBaseItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const created = await prisma.$queryRaw<BaseItemRow[]>(Prisma.sql`
      INSERT INTO baseitems (id, rpg_id, name, type, rarity)
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${parsed.data.name},
        ${parsed.data.type}::"public"."BaseItemType",
        ${parsed.data.rarity}::"public"."BaseItemRarity"
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        type,
        rarity,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return NextResponse.json({ item: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('relation "baseitems" does not exist')) {
        return NextResponse.json(
          { message: "Tabela baseitems nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao criar item." },
      { status: 500 },
    )
  }
}
