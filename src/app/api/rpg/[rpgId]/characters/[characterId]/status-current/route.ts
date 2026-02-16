import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../../generated/prisma/client"
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
  stamina: number
  statuses: Prisma.JsonValue
  currentStatuses: Prisma.JsonValue
}

const CORE_STATUS_COLUMN_BY_KEY = {
  life: "life",
  mana: "mana",
  sanity: "sanity",
  stamina: "stamina",
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
  if (!isOwner) {
    const membership = await prisma.rpgMember.findUnique({
      where: {
        rpgId_userId: {
          rpgId,
          userId,
        },
      },
      select: { status: true },
    })
    if (membership?.status !== "accepted") {
      return { ok: false as const, status: 404, message: "RPG nao encontrado." }
    }
  }

  const rows = await prisma.$queryRaw<CharacterStatusRow[]>(Prisma.sql`
    SELECT
      id,
      created_by_user_id AS "createdByUserId",
      life,
      mana,
      sanity,
      stamina,
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
  if (!isOwner && character.createdByUserId !== userId) {
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

    const coreColumn = CORE_STATUS_COLUMN_BY_KEY[key as keyof typeof CORE_STATUS_COLUMN_BY_KEY]
    if (coreColumn) {
      await prisma.$executeRawUnsafe(
        `
        UPDATE rpg_characters
        SET
          "${coreColumn}" = $1,
          current_statuses = COALESCE(current_statuses, '{}'::jsonb) || jsonb_build_object($2, $1),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND rpg_id = $4
        `,
        nextValue,
        key,
        characterId,
        rpgId,
      )
    } else {
      await prisma.$executeRawUnsafe(
        `
        UPDATE rpg_characters
        SET
          current_statuses = COALESCE(current_statuses, '{}'::jsonb) || jsonb_build_object($1, $2),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
          AND rpg_id = $4
        `,
        key,
        nextValue,
        characterId,
        rpgId,
      )
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

    return NextResponse.json({ message: "Erro interno ao salvar status atual." }, { status: 500 })
  }
}
