import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createBaseItemSchema } from "@/lib/validators/baseItem"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

type NamedDescription = {
  name: string
  description: string
}

type BaseItemRow = {
  id: string
  rpgId: string
  name: string
  description: string | null
  type: string
  rarity: string
  damage: string | null
  ability: string | null
  abilityName: string | null
  effect: string | null
  effectName: string | null
  abilities: Prisma.JsonValue
  effects: Prisma.JsonValue
  weight: number | null
  durability: number | null
  createdAt: Date
  updatedAt: Date
}

async function getUserIdFromToken(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

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

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : null
}

function normalizeNamedEntries(entries: NamedDescription[] | null | undefined) {
  return (entries ?? [])
    .map((entry) => ({
      name: entry.name.trim(),
      description: entry.description.trim(),
    }))
    .filter((entry) => entry.name.length > 0 && entry.description.length > 0)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const baseItems = await prisma.$queryRaw<BaseItemRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        description,
        type,
        rarity,
        damage,
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        weight,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM baseitems
      WHERE rpg_id = ${rpgId}
      ORDER BY created_at DESC
    `)

    return NextResponse.json({ items: baseItems }, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('relation "baseitems" does not exist')) {
        return NextResponse.json(
          { message: "Tabela baseitems nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }

      if (error.message.includes('column "effect_name" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "description" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao listar itens." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createBaseItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const damage = normalizeOptionalText(parsed.data.damage)
    const description = normalizeOptionalText(parsed.data.description)
    const weight = parsed.data.weight ?? null
    const durability = parsed.data.durability ?? null
    const abilities = normalizeNamedEntries(parsed.data.abilities)
    const effects = normalizeNamedEntries(parsed.data.effects)
    const abilityName = normalizeOptionalText(parsed.data.abilityName) ?? abilities[0]?.name ?? null
    const ability = normalizeOptionalText(parsed.data.ability) ?? abilities[0]?.description ?? null
    const effectName = normalizeOptionalText(parsed.data.effectName) ?? effects[0]?.name ?? null
    const effect = normalizeOptionalText(parsed.data.effect) ?? effects[0]?.description ?? null

    const created = await prisma.$queryRaw<BaseItemRow[]>(Prisma.sql`
      INSERT INTO baseitems (
        id,
        rpg_id,
        name,
        description,
        type,
        rarity,
        damage,
        ability,
        ability_name,
        effect,
        effect_name,
        abilities,
        effects,
        weight,
        durability
      )
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${parsed.data.name},
        ${description},
        ${parsed.data.type}::"public"."BaseItemType",
        ${parsed.data.rarity}::"public"."BaseItemRarity",
        ${damage},
        ${ability},
        ${abilityName},
        ${effect},
        ${effectName},
        ${JSON.stringify(abilities)}::jsonb,
        ${JSON.stringify(effects)}::jsonb,
        ${weight},
        ${durability}
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        description,
        type,
        rarity,
        damage,
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        weight,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    return NextResponse.json({ item: created[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('relation "baseitems" does not exist')) {
        return NextResponse.json(
          { message: "Tabela baseitems nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }

      if (error.message.includes('column "effect_name" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "description" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao criar item." },
      { status: 500 },
    )
  }
}
