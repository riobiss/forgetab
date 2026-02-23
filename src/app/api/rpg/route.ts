import { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createRpgSchema } from "@/lib/validators/rpg"
import { Prisma } from "../../../../generated/prisma/client.js"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    let authPayload: Awaited<ReturnType<typeof verifyAuthToken>>
    try {
      authPayload = await verifyAuthToken(token)
    } catch {
      return NextResponse.json({ message: "Token invalido." }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createRpgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const {
      title,
      description,
      image,
      visibility,
      costsEnabled,
      costResourceName,
      useMundiMap,
      useRaceBonuses,
      useClassBonuses,
      useClassRaceBonuses,
      useInventoryWeightLimit,
    } = parsed.data
    const resolvedImage = image?.trim() || null
    const resolvedCostsEnabled = Boolean(costsEnabled)
    const resolvedCostResourceName = (costResourceName?.trim() || "Skill Points").slice(0, 60)
    const resolvedUseRaceBonuses =
      typeof useRaceBonuses === "boolean"
        ? useRaceBonuses
        : Boolean(useClassRaceBonuses)
    const resolvedUseClassBonuses =
      typeof useClassBonuses === "boolean"
        ? useClassBonuses
        : Boolean(useClassRaceBonuses)
    const created = await prisma.rpg.create({
      data: {
        ownerId: authPayload.userId,
        title,
        description,
        visibility,
      },
    })

    try {
      await prisma.$executeRaw(Prisma.sql`
        UPDATE rpgs
        SET
          costs_enabled = ${resolvedCostsEnabled},
          cost_resource_name = ${resolvedCostResourceName},
          use_mundi_map = ${Boolean(useMundiMap)},
          use_race_bonuses = ${resolvedUseRaceBonuses},
          use_class_bonuses = ${resolvedUseClassBonuses},
          use_class_race_bonuses = ${resolvedUseRaceBonuses || resolvedUseClassBonuses},
          use_inventory_weight_limit = ${Boolean(useInventoryWeightLimit)}
        WHERE id = ${created.id}
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "use_race_bonuses" does not exist') ||
          error.message.includes('column "use_class_bonuses" does not exist'))
      ) {
        try {
          await prisma.$executeRaw(Prisma.sql`
            UPDATE rpgs
            SET
              costs_enabled = ${resolvedCostsEnabled},
              cost_resource_name = ${resolvedCostResourceName},
              use_mundi_map = ${Boolean(useMundiMap)},
              use_class_race_bonuses = ${resolvedUseRaceBonuses || resolvedUseClassBonuses},
              use_inventory_weight_limit = ${Boolean(useInventoryWeightLimit)}
            WHERE id = ${created.id}
          `)
        } catch {
          // Mantem compatibilidade quando a migration ainda nao foi aplicada.
        }
      } else {
        throw error
      }
    }

    if (resolvedImage) {
      try {
        await prisma.$executeRaw(Prisma.sql`
          UPDATE rpgs
          SET image = ${resolvedImage}
          WHERE id = ${created.id}
        `)
      } catch (error) {
        if (error instanceof Error && error.message.includes('column "image" does not exist')) {
          return NextResponse.json(
            { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
            { status: 500 },
          )
        }

        throw error
      }
    }

    return NextResponse.json(
      {
        rpg: {
          id: created.id,
          ownerId: created.ownerId,
          title: created.title,
          description: created.description,
          image: resolvedImage,
          visibility: created.visibility,
          costsEnabled: resolvedCostsEnabled,
          costResourceName: resolvedCostResourceName,
          useMundiMap: Boolean(useMundiMap),
          useRaceBonuses: resolvedUseRaceBonuses,
          useClassBonuses: resolvedUseClassBonuses,
          useClassRaceBonuses: resolvedUseRaceBonuses || resolvedUseClassBonuses,
          useInventoryWeightLimit: Boolean(useInventoryWeightLimit),
          createdAt: created.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { message: "Usuario do token nao existe no banco atual." },
          { status: 409 },
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
      { message: "Erro interno ao criar RPG." },
      { status: 500 },
    )
  }
}
