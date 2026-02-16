import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/auth"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimmed
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const body = (await request.json()) as { mapImage?: unknown }
    const mapImage = normalizeOptionalUrl(body.mapImage)

    let updatedCount = 0
    try {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE rpgs
        SET map_image = ${mapImage}
        WHERE id = ${rpgId}
          AND owner_id = ${userId}
        RETURNING id
      `)

      updatedCount = rows.length
    } catch (error) {
      if (error instanceof Error && error.message.includes('column "map_image" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      throw error
    }

    if (updatedCount === 0) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    return NextResponse.json(
      {
        message: "Mapa atualizado com sucesso.",
        mapImage,
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json({ message: "Erro interno ao atualizar mapa." }, { status: 500 })
  }
}
