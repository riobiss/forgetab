import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import slugify from "@/utils/slugify"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type CharacteristicTemplateRow = {
  id: string
  key: string
  label: string
  required: boolean
  position: number
}

type IncomingCharacteristicTemplate = {
  label?: unknown
  required?: unknown
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
  const permission = await getRpgPermission(rpgId, userId)
  return permission.canManage
}

async function canReadCharacterCharacteristicTemplates(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true },
  })

  if (!rpg) return false
  if (rpg.ownerId === userId) return true

  const membership = await prisma.rpgMember.findUnique({
    where: { rpgId_userId: { rpgId, userId } },
    select: { status: true },
  })

  return membership?.status === "accepted"
}

function normalizeTemplates(input: unknown) {
  const entries = Array.isArray(input) ? input : []
  const usedKeys = new Set<string>()
  const values: Array<{ key: string; label: string; required: boolean }> = []

  for (const entry of entries) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false as const, message: "Campo de caracteristica invalido." }
    }

    const candidate = entry as IncomingCharacteristicTemplate
    const label = typeof candidate.label === "string" ? candidate.label.trim() : ""
    if (label.length < 2) {
      return {
        ok: false as const,
        message: "Cada campo de caracteristica precisa ter nome com pelo menos 2 caracteres.",
      }
    }

    const base = slugify(label) || "campo-caracteristica"
    let key = base
    let suffix = 2
    while (usedKeys.has(key)) {
      key = `${base}-${suffix}`
      suffix += 1
    }
    usedKeys.add(key)

    values.push({
      key,
      label,
      required: candidate.required !== false,
    })
  }

  return { ok: true as const, values }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canReadCharacterCharacteristicTemplates(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const fields = await prisma.$queryRaw<CharacteristicTemplateRow[]>(Prisma.sql`
      SELECT id, key, label, required, position
      FROM rpg_character_characteristic_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    return NextResponse.json({ fields }, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao buscar campos de caracteristicas." },
      { status: 500 },
    )
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

    const body = (await request.json()) as { fields?: unknown }
    const normalized = normalizeTemplates(body.fields)
    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_character_characteristic_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (normalized.values.length > 0) {
      const rows = normalized.values.map((field, index) =>
        Prisma.sql`(
          ${crypto.randomUUID()},
          ${rpgId},
          ${field.key},
          ${field.label},
          ${field.required},
          ${index}
        )`,
      )

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO rpg_character_characteristic_templates (id, rpg_id, key, label, required, position)
        VALUES ${Prisma.join(rows)}
      `)
    }

    return NextResponse.json({ message: "Campos de caracteristicas atualizados." }, { status: 200 })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao salvar campos de caracteristicas." },
      { status: 500 },
    )
  }
}
