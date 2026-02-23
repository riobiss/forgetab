import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG,
} from "@/lib/rpg/statusCatalog"
import { getRpgPermission } from "@/lib/server/rpgPermissions"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type StatusTemplateRow = {
  id: string
  key: string
  label: string
  position: number
}

type IncomingStatusTemplate = {
  key?: unknown
  label?: unknown
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

async function canReadRpgStatuses(rpgId: string, userId: string) {
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

function getAllowedKeys() {
  return new Set(STATUS_CATALOG.map((item) => item.key))
}

function normalizeStatusKey(key: string) {
  return key === "stamina" ? "exhaustion" : key
}

function normalizeStatusLabel(key: string, label: string) {
  if (normalizeStatusKey(key) === "exhaustion") return "Exaustão"
  return label
}

function normalizeStatusTemplates(input: unknown) {
  const entries = Array.isArray(input) ? input : []
  const fromCatalog = new Map<string, string>(
    STATUS_CATALOG.map((item) => [item.key, item.label]),
  )
  const seen = new Set<string>()
  const normalized: Array<{ key: string; label: string }> = []
  const allowed = getAllowedKeys()

  for (const entry of entries) {
    if (typeof entry === "string") {
      const key = normalizeStatusKey(entry.trim())
      if (!key) continue

      if (seen.has(key)) continue
      seen.add(key)
      normalized.push({ key, label: normalizeStatusLabel(key, fromCatalog.get(key) ?? key) })
      continue
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false as const, message: "Status invalido." }
    }

    const candidate = entry as IncomingStatusTemplate
    const key =
      typeof candidate.key === "string" ? normalizeStatusKey(candidate.key.trim()) : ""
    const label = typeof candidate.label === "string" ? candidate.label.trim() : ""

    if (!key.match(/^[a-z0-9-]{2,40}$/)) {
      return { ok: false as const, message: `Chave de status inválida: ${key || "vazia"}.` }
    }
    if (label.length < 2) {
      return { ok: false as const, message: `Nome de status inválido para chave ${key}.` }
    }

    if (seen.has(key)) continue
    seen.add(key)
    normalized.push({ key, label: normalizeStatusLabel(key, label) })
  }

  if (normalized.length === 0) {
    return { ok: false as const, message: "Selecione pelo menos 1 status." }
  }

  const invalidCatalog = normalized.find(
    (item) =>
      allowed.has(item.key as (typeof STATUS_CATALOG)[number]["key"]) &&
      !fromCatalog.has(item.key),
  )
  if (invalidCatalog) {
      return { ok: false as const, message: `Status inválido: ${invalidCatalog.key}.` }
  }

  return { ok: true as const, values: normalized }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const hasAccess = await canReadRpgStatuses(rpgId, userId)
    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const rows = await prisma.$queryRaw<StatusTemplateRow[]>(Prisma.sql`
      SELECT id, key, label, position
      FROM rpg_status_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    if (rows.length === 0) {
      const fallback = STATUS_CATALOG.filter((item) =>
        DEFAULT_STATUS_KEYS.includes(item.key),
      ).map((item, index) => ({
        id: `default-${item.key}`,
        key: item.key,
        label: item.label,
        position: index,
      }))

      return NextResponse.json({ statuses: fallback, isDefault: true }, { status: 200 })
    }

    return NextResponse.json(
      {
        statuses: rows.map((item) => {
          const key = normalizeStatusKey(item.key)
          return {
            ...item,
            key,
            label: normalizeStatusLabel(key, item.label),
          }
        }),
        isDefault: false,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_status_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de templates de status nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao buscar status." }, { status: 500 })
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

    const body = (await request.json()) as { statuses?: unknown }
    const normalized = normalizeStatusTemplates(body.statuses)

    if (!normalized.ok) {
      return NextResponse.json({ message: normalized.message }, { status: 400 })
    }

    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM rpg_status_templates
      WHERE rpg_id = ${rpgId}
    `)

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
      INSERT INTO rpg_status_templates (id, rpg_id, key, label, position)
      VALUES ${Prisma.join(rows)}
    `)

    return NextResponse.json({ message: "Padrao de status atualizado." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_status_templates" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de templates de status nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao atualizar status." }, { status: 500 })
  }
}

