import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type MembershipStatus = "pending" | "accepted" | "rejected"
type RequestStatus = "pending" | "accepted" | "rejected"

type MembershipRow = {
  status: MembershipStatus
}

type RequestRow = {
  id: string
  status: RequestStatus
}

type PendingRequestRow = {
  id: string
  userId: string
  userUsername: string
  userName: string
  requestedAt: Date
}

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true },
    })

    if (!rpg) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const permission = await getRpgPermission(rpgId, userId)
    let isAcceptedMember = false

    if (!permission.canManage) {
      const membership = await prisma.$queryRaw<MembershipRow[]>(Prisma.sql`
        SELECT status
        FROM rpg_members
        WHERE rpg_id = ${rpgId}
          AND user_id = ${userId}
        LIMIT 1
      `)

      isAcceptedMember = membership[0]?.status === "accepted"
    }

    if (!permission.canManage && !isAcceptedMember) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    if (permission.canManage) {
      const pendingRequests = await prisma.$queryRaw<PendingRequestRow[]>(Prisma.sql`
        SELECT
          r.id,
          r.user_id AS "userId",
          u.username AS "userUsername",
          u.name AS "userName",
          r.requested_at AS "requestedAt"
        FROM rpg_character_creation_requests r
        INNER JOIN users u ON u.id = r.user_id
        WHERE r.rpg_id = ${rpgId}
          AND r.status = 'pending'::"public"."CharacterCreationRequestStatus"
        ORDER BY r.requested_at DESC
      `)

      return NextResponse.json(
        { isOwner: true, pendingRequests, canRequest: false, canCreate: true },
        { status: 200 },
      )
    }

    const userRequest = await prisma.$queryRaw<RequestRow[]>(Prisma.sql`
      SELECT id, status
      FROM rpg_character_creation_requests
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    const requestStatus = userRequest[0]?.status ?? null

    return NextResponse.json(
      {
        isOwner: false,
        canRequest: isAcceptedMember,
        canCreate: isAcceptedMember && requestStatus === "accepted",
        requestStatus,
      },
      { status: 200 },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_creation_requests" does not exist')
    ) {
      return NextResponse.json(
        {
          message:
            "Tabela de solicitacoes de criacao de personagem nao existe no banco. Rode a migration.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao consultar solicitacoes de personagem." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { id: true, ownerId: true },
    })

    if (!rpg) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const permission = await getRpgPermission(rpgId, userId)
    if (permission.canManage) {
      return NextResponse.json(
        { message: "Mestre ou moderador nao precisam solicitar criacao de personagem." },
        { status: 400 },
      )
    }

    const membership = await prisma.$queryRaw<MembershipRow[]>(Prisma.sql`
      SELECT status
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    if (membership[0]?.status !== "accepted") {
      return NextResponse.json(
        { message: "Somente membros aceitos podem solicitar criacao de personagem." },
        { status: 403 },
      )
    }

    const existing = await prisma.$queryRaw<RequestRow[]>(Prisma.sql`
      SELECT id, status
      FROM rpg_character_creation_requests
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)

    if (existing.length === 0) {
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO rpg_character_creation_requests (id, rpg_id, user_id, status)
        VALUES (
          ${crypto.randomUUID()},
          ${rpgId},
          ${userId},
          'pending'::"public"."CharacterCreationRequestStatus"
        )
      `)

      return NextResponse.json(
        { message: "Solicitacao enviada para o mestre." },
        { status: 201 },
      )
    }

    const current = existing[0]
    if (current.status === "pending") {
      return NextResponse.json(
        { message: "Voce ja possui uma solicitacao pendente." },
        { status: 409 },
      )
    }

    if (current.status === "accepted") {
      return NextResponse.json(
        { message: "Sua permissao para criar personagem ja foi aprovada." },
        { status: 409 },
      )
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE rpg_character_creation_requests
      SET
        status = 'pending'::"public"."CharacterCreationRequestStatus",
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
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_creation_requests" does not exist')
    ) {
      return NextResponse.json(
        {
          message:
            "Tabela de solicitacoes de criacao de personagem nao existe no banco. Rode a migration.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao solicitar criacao de personagem." },
      { status: 500 },
    )
  }
}
