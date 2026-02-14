import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type RouteContext = {
  params: Promise<{
    rpgId: string
    memberId: string
  }>
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId, memberId } = await context.params

    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: { ownerId: true },
    })

    if (!rpg) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    if (rpg.ownerId !== userId) {
      return NextResponse.json(
        { message: "Somente o mestre pode aprovar solicitacoes." },
        { status: 403 },
      )
    }

    const body = (await request.json()) as { action?: "accept" | "reject" }

    if (!body.action || !["accept", "reject"].includes(body.action)) {
      return NextResponse.json(
        { message: "Acao invalida." },
        { status: 400 },
      )
    }

    const nextStatus = body.action === "accept" ? "accepted" : "rejected"

    const updated = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      UPDATE rpg_members
      SET
        status = ${nextStatus}::"public"."RpgMemberStatus",
        responded_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${memberId}
        AND rpg_id = ${rpgId}
        AND status = 'pending'::"public"."RpgMemberStatus"
      RETURNING id
    `)

    if (updated.length === 0) {
      return NextResponse.json(
        { message: "Solicitacao nao encontrada ou ja processada." },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        message:
          body.action === "accept"
            ? "Solicitacao aprovada."
            : "Solicitacao recusada.",
      },
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
      { message: "Erro interno ao processar solicitacao." },
      { status: 500 },
    )
  }
}
