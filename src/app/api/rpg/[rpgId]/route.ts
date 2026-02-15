import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { createRpgSchema } from "@/lib/validators/rpg"
import { getUserIdFromRequest } from "@/lib/server/auth"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type RpgRow = {
  id: string
  ownerId: string
  title: string
  description: string
  visibility: "private" | "public"
  useClassRaceBonuses: boolean
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params

    let rows: RpgRow[] = []
    try {
      rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          title,
          description,
          visibility,
          COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('column "use_class_race_bonuses" does not exist')
      ) {
        rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
          SELECT
            id,
            owner_id AS "ownerId",
            title,
            description,
            visibility,
            false AS "useClassRaceBonuses"
          FROM rpgs
          WHERE id = ${rpgId}
          LIMIT 1
        `)
      } else {
        throw error
      }
    }
    const rpg = rows[0]

    if (!rpg) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    const isOwner = rpg.ownerId === userId
    let isAcceptedMember = false

    if (!isOwner) {
      const membership = await prisma.rpgMember.findUnique({
        where: {
          rpgId_userId: {
            rpgId,
            userId,
          },
        },
        select: { status: true },
      })

      isAcceptedMember = membership?.status === "accepted"
    }

    if (!isOwner && rpg.visibility === "private" && !isAcceptedMember) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        rpg: {
          id: rpg.id,
          title: rpg.title,
          description: rpg.description,
          visibility: rpg.visibility,
          useClassRaceBonuses: rpg.useClassRaceBonuses,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { message: "Erro interno ao carregar RPG." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const body = await request.json()
    const parsed = createRpgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const { rpgId } = await context.params
    const { title, description, visibility, useClassRaceBonuses } = parsed.data

    const updated = await prisma.rpg.updateMany({
      where: { id: rpgId, ownerId: userId },
      data: { title, description, visibility },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    if (typeof useClassRaceBonuses === "boolean") {
      try {
        await prisma.$executeRaw(Prisma.sql`
          UPDATE rpgs
          SET use_class_race_bonuses = ${useClassRaceBonuses}
          WHERE id = ${rpgId}
            AND owner_id = ${userId}
        `)
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !error.message.includes('column "use_class_race_bonuses" does not exist')
        ) {
          throw error
        }
      }
    }

    return NextResponse.json(
      { message: "RPG atualizado com sucesso." },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    if (error instanceof Error) {
      if (
        error.message.includes('relation "rpgs" does not exist') ||
        error.message.includes("Could not find the table")
      ) {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao atualizar RPG." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params

    const deleted = await prisma.rpg.deleteMany({
      where: { id: rpgId, ownerId: userId },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    return NextResponse.json({ message: "RPG deletado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    if (error instanceof Error) {
      if (
        error.message.includes('relation "rpgs" does not exist') ||
        error.message.includes("Could not find the table")
      ) {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao deletar RPG." },
      { status: 500 },
    )
  }
}
