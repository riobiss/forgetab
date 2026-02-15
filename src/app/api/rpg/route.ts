import { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createRpgSchema } from "@/lib/validators/rpg"
import { Prisma } from "../../../../generated/prisma/client"

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

    const { title, description, visibility, useClassRaceBonuses } = parsed.data
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
        SET use_class_race_bonuses = ${Boolean(useClassRaceBonuses)}
        WHERE id = ${created.id}
      `)
    } catch {
      // Mantem compatibilidade quando a migration ainda nao foi aplicada.
    }

    return NextResponse.json(
      {
        rpg: {
          id: created.id,
          ownerId: created.ownerId,
          title: created.title,
          description: created.description,
          visibility: created.visibility,
          useClassRaceBonuses: Boolean(useClassRaceBonuses),
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
