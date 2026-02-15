import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import {
  ATTRIBUTE_CATALOG,
  DEFAULT_ATTRIBUTE_KEYS,
} from "@/lib/rpg/attributeCatalog"
import {
  DEFAULT_STATUS_KEYS,
  STATUS_CATALOG,
} from "@/lib/rpg/statusCatalog"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
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

function validateStat(name: string, value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { ok: false as const, message: `Valor invalido para ${name}.` }
  }

  return { ok: true as const, value: Math.floor(value) }
}

function isValidVisibility(value: unknown): value is "private" | "public" {
  return value === "private" || value === "public"
}

function getDefaultAttributeTemplate(): AttributeTemplateRow[] {
  return ATTRIBUTE_CATALOG.filter((item) =>
    DEFAULT_ATTRIBUTE_KEYS.includes(item.key),
  ).map((item, index) => ({
    key: item.key,
    label: item.label,
    position: index,
  }))
}

function getDefaultStatusTemplate(): StatusTemplateRow[] {
  return STATUS_CATALOG.filter((item) => DEFAULT_STATUS_KEYS.includes(item.key)).map(
    (item, index) => ({
      key: item.key,
      label: item.label,
      position: index,
    }),
  )
}

async function canManageCharacter(rpgId: string, characterId: string, userId: string) {
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

  const character = await prisma.$queryRaw<
    Array<{ id: string; createdByUserId: string | null }>
  >(Prisma.sql`
    SELECT
      id,
      created_by_user_id AS "createdByUserId"
    FROM rpg_characters
    WHERE id = ${characterId}
      AND rpg_id = ${rpgId}
    LIMIT 1
  `)

  if (character.length === 0) {
    return { ok: false as const, status: 404, message: "Personagem nao encontrado." }
  }

  if (!isOwner && character[0].createdByUserId !== userId) {
    return { ok: false as const, status: 403, message: "Sem permissao para editar este personagem." }
  }

  return { ok: true as const, isOwner }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const body = (await request.json()) as {
      name?: string
      statuses?: Record<string, number>
      attributes?: Record<string, number>
      visibility?: "private" | "public"
    }

    const name = body.name?.trim() ?? ""
    if (name.length < 2) {
      return NextResponse.json(
        { message: "Nome deve ter pelo menos 2 caracteres." },
        { status: 400 },
      )
    }

    if (body.visibility !== undefined && !isValidVisibility(body.visibility)) {
      return NextResponse.json(
        { message: "Visibilidade invalida. Use private ou public." },
        { status: 400 },
      )
    }

    const visibility = body.visibility ?? null

    let dbAttributeTemplate: AttributeTemplateRow[] = []
    try {
      dbAttributeTemplate = await prisma.$queryRaw<AttributeTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
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
    const template =
      dbAttributeTemplate.length > 0 ? dbAttributeTemplate : getDefaultAttributeTemplate()

    const parsedAttributes = validateAttributesPayload(body.attributes, template)
    if (!parsedAttributes.ok) {
      return NextResponse.json({ message: parsedAttributes.message }, { status: 400 })
    }

    let dbStatusTemplate: StatusTemplateRow[] = []
    try {
      dbStatusTemplate = await prisma.$queryRaw<StatusTemplateRow[]>(Prisma.sql`
        SELECT key, label, position
        FROM rpg_status_templates
        WHERE rpg_id = ${rpgId}
        ORDER BY position ASC
      `)
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.includes('relation "rpg_status_templates" does not exist')
        )
      ) {
        throw error
      }
    }
    const statusTemplate =
      dbStatusTemplate.length > 0 ? dbStatusTemplate : getDefaultStatusTemplate()

    const parsedStatuses = validateStatusesPayload(body.statuses, statusTemplate)
    if (!parsedStatuses.ok) {
      return NextResponse.json({ message: parsedStatuses.message }, { status: 400 })
    }

    const life = validateStat("vida", parsedStatuses.value.life ?? 0)
    if (!life.ok) return NextResponse.json({ message: life.message }, { status: 400 })

    const defense = validateStat("defesa", parsedStatuses.value.defense ?? 0)
    if (!defense.ok) return NextResponse.json({ message: defense.message }, { status: 400 })

    const mana = validateStat("mana", parsedStatuses.value.mana ?? 0)
    if (!mana.ok) return NextResponse.json({ message: mana.message }, { status: 400 })

    const stamina = validateStat("estamina", parsedStatuses.value.stamina ?? 0)
    if (!stamina.ok) return NextResponse.json({ message: stamina.message }, { status: 400 })

    const sanity = validateStat("sanidade", parsedStatuses.value.sanity ?? 0)
    if (!sanity.ok) return NextResponse.json({ message: sanity.message }, { status: 400 })

    const updated = await prisma.$queryRaw<
      Array<{
        id: string
      }>
    >(Prisma.sql`
      UPDATE rpg_characters
      SET
        name = ${name},
        visibility = COALESCE(${visibility}::"RpgVisibility", visibility),
        life = ${life.value},
        defense = ${defense.value},
        mana = ${mana.value},
        stamina = ${stamina.value},
        sanity = ${sanity.value},
        statuses = ${JSON.stringify(parsedStatuses.value)}::jsonb,
        attributes = ${JSON.stringify(parsedAttributes.value)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
      RETURNING id
    `)

    if (updated.length === 0) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({ message: "Personagem atualizado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "visibility" of relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao atualizar personagem." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const isOwner = permission.isOwner

    const deleted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      DELETE FROM rpg_characters
      WHERE id = ${characterId}
        AND rpg_id = ${rpgId}
        ${
          isOwner
            ? Prisma.empty
            : Prisma.sql`AND created_by_user_id = ${userId}`
        }
      RETURNING id
    `)

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({ message: "Personagem deletado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return NextResponse.json(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao deletar personagem." },
      { status: 500 },
    )
  }
}
