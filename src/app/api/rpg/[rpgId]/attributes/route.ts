import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import slugify from "@/utils/slugify"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

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

type AttributeInput = {
  key?: string
  label?: string
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

function normalizeAttributeTemplates(
  input: unknown,
): { ok: true; values: Array<AttributeInput & { key: string; label: string }> } | { ok: false; message: string } {
  const entries = Array.isArray(input) ? input : []
  const templates: Array<AttributeInput & { key: string; label: string }> = []
  const usedKeys = new Set<string>()

  for (const rawEntry of entries) {
    if (!rawEntry || typeof rawEntry !== "object") continue
    const entry = rawEntry as AttributeInput
    const label = (entry.label ?? "").trim()
    if (label.length < 2) {
      return { ok: false, message: "Cada atributo precisa de um nome com pelo menos 2 caracteres." }
    }

    const candidateKey =
      (typeof entry.key === "string" && entry.key.trim()
        ? slugify(entry.key.trim())
        : slugify(label)) || ""

    if (!candidateKey) {
      return { ok: false, message: `Nao foi possivel gerar chave para o atributo ${label}.` }
    }

    let uniqueKey = candidateKey
    let suffix = 2
    while (usedKeys.has(uniqueKey)) {
      uniqueKey = `${candidateKey}-${suffix}`
      suffix += 1
    }

    usedKeys.add(uniqueKey)
    templates.push({ key: uniqueKey, label })
  }

  return { ok: true, values: templates }
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

    return NextResponse.json({ attributes: rows, isDefault: rows.length === 0 }, { status: 200 })
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

    const body = (await request.json()) as { attributes?: unknown }
    const normalized = normalizeAttributeTemplates(body.attributes)

    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (normalized.values.length > 0) {
      const rows = normalized.values.map((item, index) =>
        Prisma.sql`(
          ${crypto.randomUUID()},
          ${rpgId},
          ${item.key},
          ${item.label},
          ${index}
        )`,
      )

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO rpg_attribute_templates (id, rpg_id, key, label, position)
        VALUES ${Prisma.join(rows)}
      `)
    }

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
