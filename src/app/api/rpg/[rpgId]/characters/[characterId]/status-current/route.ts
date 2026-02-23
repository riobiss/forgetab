import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

type CharacterStatusRow = {
  id: string
  createdByUserId: string | null
  life: number
  mana: number
  sanity: number
  exhaustion: number
  statuses: Prisma.JsonValue
  currentStatuses: Prisma.JsonValue
}

const CORE_STATUS_COLUMN_BY_KEY = {
  life: "life",
  mana: "mana",
  sanity: "sanity",
  exhaustion: "stamina",
} as const

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

async function canManageCurrentStatus(rpgId: string, characterId: string, userId: string) {
  const rpg = await prisma.rpg.findUnique({
    where: { id: rpgId },
    select: { id: true, ownerId: true },
  })

  if (!rpg) {
    return { ok: false as const, status: 404, message: "RPG nao encontrado." }
  }

  const isOwner = rpg.ownerId === userId
  let isModerator = false
  if (!isOwner) {
    const membership = await prisma.$queryRaw<Array<{ status: string; role: string }>>(Prisma.sql`
      SELECT status::text AS status, role::text AS role
      FROM rpg_members
      WHERE rpg_id = ${rpgId}
        AND user_id = ${userId}
      LIMIT 1
    `)
    if (membership[0]?.status !== "accepted") {
      return { ok: false as const, status: 404, message: "RPG nao encontrado." }
    }
    isModerator = membership[0]?.role === "moderator"
  }
  const canManageAsMaster = isOwner || isModerator

  const rows = await prisma.$queryRaw<CharacterStatusRow[]>(Prisma.sql`
    SELECT
      id,
      created_by_user_id AS "createdByUserId",
      life,
      mana,
      sanity,
      stamina AS exhaustion,
      statuses,
      COALESCE(current_statuses, '{}'::jsonb) AS "currentStatuses"
    FROM rpg_characters
    WHERE id = ${characterId}
      AND rpg_id = ${rpgId}
    LIMIT 1
  `)

  if (rows.length === 0) {
    return { ok: false as const, status: 404, message: "Personagem nao encontrado." }
  }

  const character = rows[0]
  if (!canManageAsMaster && character.createdByUserId !== userId) {
    return { ok: false as const, status: 403, message: "Sem permissao para editar este personagem." }
  }

  return { ok: true as const, character }
}

function parseStatusKey(value: unknown): string | null {
  if (typeof value !== "string") return null
  const key = value.trim()
  return key.length > 0 ? key : null
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const permission = await canManageCurrentStatus(rpgId, characterId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const body = (await request.json()) as { key?: unknown; value?: unknown }
    const key = parseStatusKey(body.key)
    if (!key) {
      return NextResponse.json({ message: "Status invalido para atualizacao." }, { status: 400 })
    }

    if (typeof body.value !== "number" || !Number.isFinite(body.value)) {
      return NextResponse.json({ message: "Valor atual invalido." }, { status: 400 })
    }

    const maxRecord =
      permission.character.statuses &&
      typeof permission.character.statuses === "object" &&
      !Array.isArray(permission.character.statuses)
        ? (permission.character.statuses as Record<string, unknown>)
        : {}
    if (!(key in maxRecord)) {
      return NextResponse.json({ message: "Status nao existe na ficha." }, { status: 400 })
    }
    const maxValue = Number(maxRecord[key] ?? 0)
    if (!Number.isFinite(maxValue) || maxValue < 0) {
      return NextResponse.json({ message: "Status maximo invalido na ficha." }, { status: 400 })
    }

    const nextValue = Math.floor(body.value)
    if (nextValue < 0 || nextValue > maxValue) {
      return NextResponse.json({ message: "Valor atual fora do limite permitido." }, { status: 400 })
    }

    const currentRecord =
      permission.character.currentStatuses &&
      typeof permission.character.currentStatuses === "object" &&
      !Array.isArray(permission.character.currentStatuses)
        ? (permission.character.currentStatuses as Record<string, unknown>)
        : {}

    const nextCurrentStatuses = Object.entries(currentRecord).reduce<Record<string, number>>(
      (acc, [statusKey, statusValue]) => {
        if (typeof statusValue === "number" && Number.isFinite(statusValue)) {
          acc[statusKey] = Math.floor(statusValue)
        }
        return acc
      },
      {},
    )
    nextCurrentStatuses[key] = nextValue

    const coreColumn = CORE_STATUS_COLUMN_BY_KEY[key as keyof typeof CORE_STATUS_COLUMN_BY_KEY]
    const updateData: {
      currentStatuses: Prisma.JsonObject
      updatedAt: Date
      life?: number
      mana?: number
      sanity?: number
      stamina?: number
    } = {
      currentStatuses: nextCurrentStatuses,
      updatedAt: new Date(),
    }

    if (coreColumn === "life") updateData.life = nextValue
    if (coreColumn === "mana") updateData.mana = nextValue
    if (coreColumn === "sanity") updateData.sanity = nextValue
    if (coreColumn === "stamina") updateData.stamina = nextValue

    const updated = await prisma.rpgCharacter.updateMany({
      where: {
        id: characterId,
        rpgId,
      },
      data: updateData,
    })

    if (updated.count === 0) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return NextResponse.json(
      { message: "Status atual salvo.", key, value: nextValue, max: maxValue },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "current_statuses" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { message: `Erro interno ao salvar status atual: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json({ message: "Erro interno ao salvar status atual." }, { status: 500 })
  }
}
