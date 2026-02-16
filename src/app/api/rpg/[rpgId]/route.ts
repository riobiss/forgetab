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
  costsEnabled: boolean
  costResourceName: string
  useMundiMap: boolean
  useClassRaceBonuses: boolean
  useInventoryWeightLimit: boolean
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
          COALESCE(costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          COALESCE(use_mundi_map, false) AS "useMundiMap",
          COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses",
          COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "costs_enabled" does not exist') ||
          error.message.includes('column "cost_resource_name" does not exist') ||
          error.message.includes('column "use_class_race_bonuses" does not exist') ||
          error.message.includes('column "use_inventory_weight_limit" does not exist') ||
          error.message.includes('column "use_mundi_map" does not exist'))
      ) {
        rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
          SELECT
            id,
            owner_id AS "ownerId",
            title,
            description,
            visibility,
            false AS "costsEnabled",
            'Skill Points' AS "costResourceName",
            false AS "useMundiMap",
            false AS "useClassRaceBonuses",
            false AS "useInventoryWeightLimit"
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
          costsEnabled: rpg.costsEnabled,
          costResourceName: rpg.costResourceName,
          useMundiMap: rpg.useMundiMap,
          useClassRaceBonuses: rpg.useClassRaceBonuses,
          useInventoryWeightLimit: rpg.useInventoryWeightLimit,
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
    const safeBody =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {}
    const requestedCostsUpdate =
      Object.prototype.hasOwnProperty.call(safeBody, "costsEnabled") ||
      Object.prototype.hasOwnProperty.call(safeBody, "costResourceName")
    if (requestedCostsUpdate) {
      return NextResponse.json(
        { message: "Configuracao de custos disponivel apenas na criacao do RPG." },
        { status: 400 },
      )
    }
    const parsed = createRpgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const { rpgId } = await context.params
    const {
      title,
      description,
      visibility,
      useMundiMap,
      useClassRaceBonuses,
      useInventoryWeightLimit,
    } = parsed.data

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

    if (
      typeof useMundiMap === "boolean" ||
      typeof useClassRaceBonuses === "boolean" ||
      typeof useInventoryWeightLimit === "boolean"
    ) {
      try {
        await prisma.$executeRaw(Prisma.sql`
          UPDATE rpgs
          SET
            use_mundi_map = ${Boolean(useMundiMap)},
            use_class_race_bonuses = ${Boolean(useClassRaceBonuses)},
            use_inventory_weight_limit = ${Boolean(useInventoryWeightLimit)}
          WHERE id = ${rpgId}
            AND owner_id = ${userId}
        `)
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (!error.message.includes('column "use_class_race_bonuses" does not exist') &&
            !error.message.includes('column "use_inventory_weight_limit" does not exist') &&
            !error.message.includes('column "use_mundi_map" does not exist'))
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
        error.message.includes('column "costs_enabled" does not exist') ||
        error.message.includes('column "cost_resource_name" does not exist') ||
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
