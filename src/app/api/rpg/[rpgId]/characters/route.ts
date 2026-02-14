import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type CharacterRow = {
  id: string
  rpgId: string
  name: string
  attributes: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

type AttributeTemplateRow = {
  key: string
  label: string
  position: number
}

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

async function canAccessRpg(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findFirst({
    where: { id: rpgId, ownerId: userId },
    select: { id: true },
  })

  return Boolean(rpg)
}

function validateAttributesPayload(
  incoming: unknown,
  template: AttributeTemplateRow[],
) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Atributos invalidos." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Atributo obrigatorio ausente: ${key}.` }
    }

    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value)) {
      return { ok: false as const, message: `Valor invalido para atributo ${key}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Atributo fora do padrao: ${extraKey}.` }
  }

  return { ok: true as const, value: record }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        attributes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ characters }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao listar personagens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = (await request.json()) as {
      name?: string
      attributes?: Record<string, number>
    }

    const name = body.name?.trim() ?? ""
    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      )
    }

    const template = await prisma.$queryRaw<AttributeTemplateRow[]>(Prisma.sql`
      SELECT key, label, position
      FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    if (template.length === 0) {
      return NextResponse.json(
        { message: "Defina o padrao de atributos no modo avancado antes de criar personagens." },
        { status: 400 },
      )
    }

    const parsedAttributes = validateAttributesPayload(body.attributes, template)
    if (!parsedAttributes.ok) {
      return NextResponse.json({ message: parsedAttributes.message }, { status: 400 })
    }

    const created = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      INSERT INTO rpg_characters (id, rpg_id, name, attributes)
      VALUES (${crypto.randomUUID()}, ${rpgId}, ${name}, ${JSON.stringify(parsedAttributes.value)}::jsonb)
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        attributes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return NextResponse.json({ character: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao criar personagem." },
      { status: 500 },
    )
  }
}
