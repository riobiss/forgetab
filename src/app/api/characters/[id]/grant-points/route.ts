import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type CharacterRow = {
  id: string
  rpgId: string
  ownerId: string
  characterType: "player" | "npc" | "monster"
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const body = (await request.json()) as { amount?: unknown }
    if (
      typeof body.amount !== "number" ||
      !Number.isInteger(body.amount) ||
      body.amount === 0
    ) {
      return NextResponse.json(
        { message: "amount deve ser um inteiro diferente de zero." },
        { status: 400 },
      )
    }

    const { id } = await context.params
    const characterRows = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      SELECT
        c.id,
        c.rpg_id AS "rpgId",
        r.owner_id AS "ownerId",
        c.character_type AS "characterType"
      FROM rpg_characters c
      INNER JOIN rpgs r ON r.id = c.rpg_id
      WHERE c.id = ${id}
      LIMIT 1
    `)

    const character = characterRows[0]
    if (!character) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    const permission = await getRpgPermission(character.rpgId, userId)
    if (!permission.canManage) {
      return NextResponse.json(
        { message: "Apenas mestre ou moderador podem conceder pontos." },
        { status: 403 },
      )
    }

    if (character.characterType !== "player") {
      return NextResponse.json(
        { message: "Somente personagens do tipo player podem receber pontos." },
        { status: 400 },
      )
    }

    const updated = await prisma.$queryRaw<Array<{ skillPoints: number }>>(Prisma.sql`
      UPDATE rpg_characters
      SET
        skill_points = GREATEST(0, skill_points + ${body.amount}),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING skill_points AS "skillPoints"
    `)

    return NextResponse.json(
      {
        success: true,
        remainingPoints: updated[0]?.skillPoints ?? 0,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('column "skill_points" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao conceder pontos." },
      { status: 500 },
    )
  }
}
