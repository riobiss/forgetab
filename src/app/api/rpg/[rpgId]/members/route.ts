import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type MembershipRow = {
  id: string
  status: "pending" | "accepted" | "rejected"
}

type RpgRow = {
  id: string
  ownerId: string
  visibility: "private" | "public"
}

type RpgUserRow = {
  id: string
  username: string
  name: string
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

async function canReadRpgMembers(rpgId: string, userId: string) {
  const rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
    SELECT
      id,
      owner_id AS "ownerId",
      visibility
    FROM rpgs
    WHERE id = ${rpgId}
    LIMIT 1
  `)

  const rpg = rows[0]
  if (!rpg) return false
  if (rpg.ownerId === userId) return true

  const membership = await prisma.$queryRaw<MembershipRow[]>(Prisma.sql`
    SELECT id, status
    FROM rpg_members
    WHERE rpg_id = ${rpgId}
      AND user_id = ${userId}
    LIMIT 1
  `)

  return membership[0]?.status === "accepted"
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
    const hasAccess = await canReadRpgMembers(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const users = await prisma.$queryRaw<RpgUserRow[]>(Prisma.sql`
      SELECT DISTINCT
        u.id,
        u.username,
        u.name
      FROM users u
      INNER JOIN (
        SELECT owner_id AS user_id
        FROM rpgs
        WHERE id = ${rpgId}
        UNION
        SELECT user_id
        FROM rpg_members
        WHERE rpg_id = ${rpgId}
          AND status = 'accepted'::"public"."RpgMemberStatus"
      ) allowed_users ON allowed_users.user_id = u.id
      ORDER BY u.name ASC
    `)

    return NextResponse.json({ users }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_members" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de membros nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao listar membros." },
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

    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true },
    })

    if (!rpg) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    if (rpg.ownerId === userId) {
      return NextResponse.json(
        { message: "Voce ja e o mestre deste RPG." },
        { status: 400 },
      )
    }

    const existing = await prisma.$queryRaw<MembershipRow[]>(Prisma.sql`
      SELECT id, status
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    if (existing.length === 0) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO rpg_members (id, rpg_id, user_id, status)
        VALUES (${crypto.randomUUID()}, ${rpgId}, ${userId}, 'pending'::"public"."RpgMemberStatus")
      `)

      return NextResponse.json(
        { message: "Solicitacao enviada para o mestre." },
        { status: 201 },
      )
    }

    const current = existing[0]

    if (current.status === "accepted") {
      return NextResponse.json(
        { message: "Voce ja e membro deste RPG." },
        { status: 409 },
      )
    }

    if (current.status === "pending") {
      return NextResponse.json(
        { message: "Voce ja possui uma solicitacao pendente." },
        { status: 409 },
      )
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_members
      SET
        status = 'pending'::"public"."RpgMemberStatus",
        requested_at = CURRENT_TIMESTAMP,
        responded_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${current.id}
    `)

    return NextResponse.json(
      { message: "Solicitacao reenviada para o mestre." },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_members" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de membros nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao solicitar participacao." },
      { status: 500 },
    )
  }
}
