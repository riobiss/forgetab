import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import slugify from "@/utils/slugify"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type SkillTemplateRow = {
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
  const permission = await getRpgPermission(rpgId, userId)
  return permission.canManage
}

async function canReadRpgSkills(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true },
  })

  if (!rpg) {
    return false
  }

  if (rpg.ownerId === userId) {
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

function normalizeSkillLabels(input: unknown) {
  if (!Array.isArray(input)) {
    return { ok: false as const, message: "Formato invalido de pericias." }
  }

  const labels = input
    .map((item) => {
      if (typeof item === "string") {
        return item.trim()
      }

      if (item && typeof item === "object" && "label" in item) {
        const candidate = (item as { label?: unknown }).label
        return typeof candidate === "string" ? candidate.trim() : ""
      }

      return ""
    })
    .filter((label) => label.length > 0)

  const unique = Array.from(new Set(labels.map((label) => label.toLocaleLowerCase("pt-BR"))))
    .map((lowerLabel) =>
      labels.find((label) => label.toLocaleLowerCase("pt-BR") === lowerLabel) ?? "",
    )
    .filter((label) => label.length > 0)

  const invalid = unique.find((label) => label.length < 2)
  if (invalid) {
    return { ok: false as const, message: `Pericia invalida: ${invalid}.` }
  }

  return { ok: true as const, values: unique }
}

function buildRows(rpgId: string, labels: string[]) {
  const usedKeys = new Set<string>()

  return labels.map((label, index) => {
    const baseKey = slugify(label) || `pericia-${index + 1}`
    let key = baseKey
    let suffix = 2

    while (usedKeys.has(key)) {
      key = `${baseKey}-${suffix}`
      suffix += 1
    }

    usedKeys.add(key)

    return {
      id: crypto.randomUUID(),
      rpgId,
      key,
      label,
      position: index,
    }
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canReadRpgSkills(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const rows = await prisma.$queryRaw<SkillTemplateRow[]>(Prisma.sql`
      SELECT id, key, label, position
      FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    if (rows.length === 0) {
      return NextResponse.json({ skills: [], isDefault: true }, { status: 200 })
    }

    return NextResponse.json({ skills: rows, isDefault: false }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de templates de pericias nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar pericias." }, { status: 500 })
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

    const body = (await request.json()) as { skills?: unknown }
    const normalized = normalizeSkillLabels(body.skills ?? [])

    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (normalized.values.length > 0) {
      const rowsToInsert = buildRows(rpgId, normalized.values)
      const rows = rowsToInsert.map((item) =>
        Prisma.sql`(
          ${item.id},
          ${item.rpgId},
          ${item.key},
          ${item.label},
          ${item.position}
        )`,
      )

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO rpg_skill_templates (id, rpg_id, key, label, position)
        VALUES ${Prisma.join(rows)}
      `)
    }

    return NextResponse.json({ message: "Padrao de pericias atualizado." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_skill_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de templates de pericias nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao atualizar pericias." }, { status: 500 })
  }
}
