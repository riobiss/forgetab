import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createRpgSchema } from "@/lib/validators/rpg"

type RouteContext = {
  params: Promise<{
    rpgId: string
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

    const rpg = await prisma.rpg.findUnique({
      where: { id: rpgId },
      select: {
        id: true,
        ownerId: true,
        title: true,
        description: true,
        visibility: true,
      },
    })

    if (!rpg || rpg.ownerId !== userId) {
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
    const userId = await getUserIdFromToken(request)

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
    const { title, description, visibility } = parsed.data

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

    return NextResponse.json({ message: "RPG atualizado com sucesso." }, { status: 200 })
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
