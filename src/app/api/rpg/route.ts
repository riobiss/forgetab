import { randomUUID } from "crypto"
import { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createRpgSchema } from "@/lib/validators/rpg"

type CreatedRpgRow = {
  id: string
  owner_id: string
  title: string
  description: string
  visibility: "private" | "public"
  created_at: Date
}

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

    const { title, description, visibility } = parsed.data
    const rpgId = randomUUID()
    const rows = await prisma.$queryRaw<CreatedRpgRow[]>`
      INSERT INTO "rpgs" ("id", "owner_id", "title", "description", "visibility")
      VALUES (${rpgId}, ${authPayload.userId}, ${title}, ${description}, ${visibility}::"RpgVisibility")
      RETURNING "id", "owner_id", "title", "description", "visibility", "created_at"
    `

    const created = rows[0]
    return NextResponse.json(
      {
        rpg: {
          id: created.id,
          ownerId: created.owner_id,
          title: created.title,
          description: created.description,
          visibility: created.visibility,
          createdAt: created.created_at,
        },
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { message: "Erro interno ao criar RPG." },
      { status: 500 },
    )
  }
}
