import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import {
  ATTRIBUTE_CATALOG,
  DEFAULT_ATTRIBUTE_KEYS,
} from "@/lib/rpg/attributeCatalog"
import slugify from "@/utils/slugify"
import { normalizeClassRaceTemplates } from "@/lib/rpg/classRaceBonuses"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type RaceTemplateRow = {
  id: string
  key: string
  label: string
  position: number
  attributeBonuses: Prisma.JsonValue
  skillBonuses: Prisma.JsonValue
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

async function canReadRpgRaces(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true, visibility: true },
  })

  if (!rpg) return false
  if (rpg.visibility === "public" || rpg.ownerId === userId) return true

  const membership = await prisma.rpgMember.findUnique({
    where: { rpgId_userId: { rpgId, userId } },
    select: { status: true },
  })

  return membership?.status === "accepted"
}

function parseJsonRecord(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  const record = value as Record<string, unknown>
  return Object.entries(record).reduce<Record<string, number>>((acc, [key, current]) => {
    if (typeof current === "number" && Number.isFinite(current)) {
      acc[key] = Math.floor(current)
    }
    return acc
  }, {})
}

function getDefaultAttributeTemplateKeys() {
  return ATTRIBUTE_CATALOG.filter((item) => DEFAULT_ATTRIBUTE_KEYS.includes(item.key)).map(
    (item) => item.key,
  )
}

async function getAllowedAttributeKeys(rpgId: string) {
  let rows: Array<{ key: string }> = []

  try {
    rows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
      SELECT key
      FROM rpg_attribute_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        error.message.includes('relation "rpg_attribute_templates" does not exist')
      )
    ) {
      throw error
    }
  }

  if (rows.length === 0) {
    return getDefaultAttributeTemplateKeys()
  }

  return rows.map((item) => item.key)
}

async function getAllowedSkillKeys(rpgId: string) {
  let rows: Array<{ key: string }> = []

  try {
    rows = await prisma.$queryRaw<Array<{ key: string }>>(Prisma.sql`
      SELECT key
      FROM rpg_skill_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)
  } catch (error) {
    if (
      !(
        error instanceof Error &&
        error.message.includes('relation "rpg_skill_templates" does not exist')
      )
    ) {
      throw error
    }
  }

  return rows.map((item) => item.key)
}

function createUniqueKey(label: string, used: Set<string>) {
  const base = slugify(label) || "raca"
  let key = base
  let suffix = 2

  while (used.has(key)) {
    key = `${base}-${suffix}`
    suffix += 1
  }
  used.add(key)

  return key
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canReadRpgRaces(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const rows = await prisma.$queryRaw<RaceTemplateRow[]>(Prisma.sql`
      SELECT id, key, label, position, attribute_bonuses AS "attributeBonuses", skill_bonuses AS "skillBonuses"
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    const races = rows.map((item) => ({
      id: item.id,
      key: item.key,
      label: item.label,
      position: item.position,
      attributeBonuses: parseJsonRecord(item.attributeBonuses),
      skillBonuses: parseJsonRecord(item.skillBonuses),
    }))

    return NextResponse.json({ races }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_race_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de racas nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar racas." }, { status: 500 })
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

    const allowedAttributeKeys = await getAllowedAttributeKeys(rpgId)
    const allowedSkillKeys = await getAllowedSkillKeys(rpgId)
    const body = (await request.json()) as { races?: unknown }
    const parsed = normalizeClassRaceTemplates(
      body.races ?? [],
      allowedAttributeKeys,
      allowedSkillKeys,
    )
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 })
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
    `)

    if (parsed.values.length > 0) {
      const used = new Set<string>()
      const values = parsed.values.map((item, index) =>
        Prisma.sql`(
          ${crypto.randomUUID()},
          ${rpgId},
          ${createUniqueKey(item.label, used)},
          ${item.label},
          ${JSON.stringify(item.attributeBonuses)}::jsonb,
          ${JSON.stringify(item.skillBonuses)}::jsonb,
          ${index}
        )`,
      )

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO rpg_race_templates (id, rpg_id, key, label, attribute_bonuses, skill_bonuses, position)
        VALUES ${Prisma.join(values)}
      `)
    }

    return NextResponse.json({ message: "Racas atualizadas com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_race_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de racas nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao salvar racas." }, { status: 500 })
  }
}
