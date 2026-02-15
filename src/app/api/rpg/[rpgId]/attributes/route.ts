import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import {
  ATTRIBUTE_CATALOG,
  DEFAULT_ATTRIBUTE_KEYS,
} from "@/lib/rpg/attributeCatalog"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type AttributeTemplateRow = {
  id: string
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

async function canReadRpgAttributes(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })

  if (!rpg) {
    return false
  }

  if (rpg.visibility === "public" || rpg.ownerId === userId) {
    return true
  }

  const membership = await prisma.rpgMember.findUnique({
    where: {
      rpgId_userId: {
        rpgId,
        userId,
      },
    },
    select: { status: true },
  })

  return membership?.status === "accepted"
}

function getAllowedKeys() {
  return new Set(ATTRIBUTE_CATALOG.map((item) => item.key))
}

function normalizeAttributeKeys(input: string[]) {
  const allowed = getAllowedKeys()
  const unique = Array.from(new Set(input))

  if (unique.length === 0) {
    return { ok: false as const, message: "Selecione pelo menos 1 atributo." }
  }

  const invalid = unique.find((key) => !allowed.has(key as (typeof ATTRIBUTE_CATALOG)[number]["key"]))
  if (invalid) {
    return { ok: false as const, message: `Atributo invalido: ${invalid}.` }
  }

  return { ok: true as const, values: unique }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canReadRpgAttributes(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const rows = await prisma.$queryRaw<AttributeTemplateRow[]>(Prisma.sql`
      SELECT id, key, label, position
      FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    if (rows.length === 0) {
      const fallback = ATTRIBUTE_CATALOG
        .filter((item) => DEFAULT_ATTRIBUTE_KEYS.includes(item.key))
        .map((item, index) => ({
          id: `default-${item.key}`,
          key: item.key,
          label: item.label,
          position: index,
        }))

      return NextResponse.json({ attributes: fallback, isDefault: true }, { status: 200 })
    }

    return NextResponse.json({ attributes: rows, isDefault: false }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de templates de atributos nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar atributos." }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    const body = (await request.json()) as { attributes?: string[] }
    const candidate = Array.isArray(body.attributes) ? body.attributes : []
    const normalized = normalizeAttributeKeys(candidate)

    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    const byKey = new Map(ATTRIBUTE_CATALOG.map((item) => [item.key, item.label]))

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
    `)

    const rows = normalized.values.map((key, index) =>
      Prisma.sql`(
        ${crypto.randomUUID()},
        ${rpgId},
        ${key},
        ${byKey.get(key) ?? key},
        ${index}
      )`,
    )

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO rpg_attribute_templates (id, rpg_id, key, label, position)
      VALUES ${Prisma.join(rows)}
    `)

    return NextResponse.json({ message: "Padrao de atributos atualizado." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_attribute_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de templates de atributos nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao atualizar atributos." }, { status: 500 })
  }
}
