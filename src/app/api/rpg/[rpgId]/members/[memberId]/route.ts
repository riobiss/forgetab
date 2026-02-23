import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

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

async function canManageMembers(rpgId: string, userId: string) {
  const permission = await getRpgPermission(rpgId, userId)
  if (!permission.exists) {
    return { ok: false as const, message: "RPG nao encontrado.", status: 404 }
  }

  if (!permission.canManage) {
    return {
      ok: false as const,
      message: "Somente mestre ou moderador podem gerenciar membros.",
      status: 403,
    }
  }

  return { ok: true as const, ownerId: permission.ownerId ?? "" }
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

    const permission = await canManageMembers(rpgId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const body = (await request.json()) as {
      action?: "accept" | "reject" | "toggleModerator"
    }

    if (!body.action || !["accept", "reject", "toggleModerator"].includes(body.action)) {
      return NextResponse.json(
        { message: "Acao invalida." },
        { status: 400 },
      )
    }

    if (body.action === "toggleModerator") {
      const updatedRole = await prisma.$queryRaw<Array<{ role: string }>>(Prisma.sql`
        UPDATE rpg_members
        SET
          role = CASE
            WHEN role = 'moderator'::"public"."RpgMemberRole" THEN 'member'::"public"."RpgMemberRole"
            ELSE 'moderator'::"public"."RpgMemberRole"
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${memberId}
          AND rpg_id = ${rpgId}
          AND status = 'accepted'::"public"."RpgMemberStatus"
          AND user_id <> ${permission.ownerId}
        RETURNING role::text AS role
      `)

      if (updatedRole.length === 0) {
        return NextResponse.json(
          { message: "Membro nao encontrado para alternar moderacao." },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          message:
            updatedRole[0].role === "moderator"
              ? "Membro promovido para moderador."
              : "Membro removido da moderacao.",
          role: updatedRole[0].role,
        },
        { status: 200 },
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId, memberId } = await context.params

    const permission = await canManageMembers(rpgId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const deleted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_members
      WHERE id = ${memberId}
        AND rpg_id = ${rpgId}
        AND status = 'accepted'::"public"."RpgMemberStatus"
        AND user_id <> ${permission.ownerId}
      RETURNING id
    `)

    if (deleted.length === 0) {
      return NextResponse.json(
        { message: "Membro nao encontrado para expulsao." },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "Membro expulso com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_members" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de membros nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao expulsar membro." },
      { status: 500 },
    )
  }
}
