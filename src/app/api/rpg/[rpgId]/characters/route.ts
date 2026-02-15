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
  characterType: "player" | "npc" | "monster"
  life: number
  defense: number
  mana: number
  stamina: number
  sanity: number
  statuses: Prisma.JsonValue
  attributes: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

type AttributeTemplateRow = {
  key: string
  label: string
  position: number
}

type StatusTemplateRow = {
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

function validateStatusesPayload(
  incoming: unknown,
  template: StatusTemplateRow[],
) {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return { ok: false as const, message: "Status invalidos." }
  }

  const record = incoming as Record<string, unknown>
  const allowedKeys = template.map((item) => item.key)

  for (const key of allowedKeys) {
    if (!(key in record)) {
      return { ok: false as const, message: `Status obrigatorio ausente: ${key}.` }
    }

    const value = record[key]
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return { ok: false as const, message: `Valor invalido para status ${key}.` }
    }
  }

  const extraKey = Object.keys(record).find((key) => !allowedKeys.includes(key))
  if (extraKey) {
    return { ok: false as const, message: `Status fora do padrao: ${extraKey}.` }
  }

  return { ok: true as const, value: record as Record<string, number> }
}

function isValidCharacterType(value: unknown): value is CharacterRow["characterType"] {
  return value === "player" || value === "npc" || value === "monster"
}

function validateStat(name: string, value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: `Valor invalido para ${name}.` }
  }

  return { ok: true as const, value: Math.floor(value) }
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
        character_type AS "characterType",
        life,
        defense,
        mana,
        stamina,
        sanity,
        statuses,
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
      characterType?: CharacterRow["characterType"]
      statuses?: Record<string, number>
      attributes?: Record<string, number>
    }

    const name = body.name?.trim() ?? ""
    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      )
    }

    if (!isValidCharacterType(body.characterType)) {
      return NextResponse.json(
        { message: "Tipo invalido. Use player, npc ou monster." },
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

    const statusTemplate = await prisma.$queryRaw<StatusTemplateRow[]>(Prisma.sql`
      SELECT key, label, position
      FROM rpg_status_templates
      WHERE rpg_id = ${rpgId}
      ORDER BY position ASC
    `)

    if (statusTemplate.length === 0) {
      return NextResponse.json(
        { message: "Defina o padrao de status no modo avancado antes de criar personagens." },
        { status: 400 },
      )
    }

    const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
    if (!parsedStatuses.ok) {
      return NextResponse.json({ message: parsedStatuses.message }, { status: 400 })
    }

    const life = validateStat("vida", parsedStatuses.value.life ?? 0)
    if (!life.ok) return NextResponse.json({ message: life.message }, { status: 400 })

    const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
    if (!defense.ok) {
      return NextResponse.json({ message: defense.message }, { status: 400 })
    }

    const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
    if (!mana.ok) return NextResponse.json({ message: mana.message }, { status: 400 })

    const stamina = validateStat("estamina", parsedStatuses.value.stamina ?? 0)
    if (!stamina.ok) {
      return NextResponse.json({ message: stamina.message }, { status: 400 })
    }

    const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
    if (!sanity.ok) {
      return NextResponse.json({ message: sanity.message }, { status: 400 })
    }

    const created = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
      INSERT INTO rpg_characters (
        id, rpg_id, name, character_type, life, defense, mana, stamina, sanity, statuses, attributes
      )
      VALUES (
        ${crypto.randomUUID()},
        ${rpgId},
        ${name},
        ${body.characterType}::"RpgCharacterType",
        ${life.value},
        ${defense.value},
        ${mana.value},
        ${stamina.value},
        ${sanity.value},
        ${JSON.stringify(parsedStatuses.value)}::jsonb,
        ${JSON.stringify(parsedAttributes.value)}::jsonb
      )
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        character_type AS "characterType",
        life,
        defense,
        mana,
        stamina,
        sanity,
        statuses,
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
