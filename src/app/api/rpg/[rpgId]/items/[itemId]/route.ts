import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { createBaseItemSchema } from "@/lib/validators/baseItem"

type RouteContext = {
  params: Promise<{
    rpgId: string
    itemId: string
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
  image: string | null
  description: string | null
  type: string
  rarity: string
  damage: string | null
  range: string | null
  ability: string | null
  abilityName: string | null
  effect: string | null
  effectName: string | null
  abilities: Prisma.JsonValue
  effects: Prisma.JsonValue
  weight: number | null
  duration: string | null
  durability: number | null
  createdAt: Date
  updatedAt: Date
}

function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!privateKey || !urlEndpoint) {
    return { ok: false as const }
  }

  return { ok: true as const, privateKey, urlEndpoint }
}

function parseHost(value: string) {
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

function normalizeUrlPath(value: string) {
  try {
    return new URL(value).pathname
  } catch {
    return null
  }
}

function extractFileNameFromUrl(value: string) {
  const path = normalizeUrlPath(value)
  if (!path) return null

  const parts = path.split("/").filter(Boolean)
  if (parts.length === 0) return null

  return parts[parts.length - 1]
}

async function deleteImageKitFileByUrl(
  privateKey: string,
  urlEndpoint: string,
  rawUrl: string | null,
) {
  if (!rawUrl) return

  const imageUrl = rawUrl.trim()
  if (!imageUrl) return

  const endpointHost = parseHost(urlEndpoint)
  const imageUrlHost = parseHost(imageUrl)
  if (!endpointHost || !imageUrlHost || endpointHost !== imageUrlHost) {
    return
  }

  const fileName = extractFileNameFromUrl(imageUrl)
  if (!fileName) return

  const auth = Buffer.from(`${privateKey}:`, "utf8").toString("base64")
  const escapedFileName = fileName.replace(/"/g, '\\"')
  const searchQuery = encodeURIComponent(`name = "${escapedFileName}"`)
  const listResponse = await fetch(
    `https://api.imagekit.io/v1/files?limit=100&searchQuery=${searchQuery}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    },
  )

  if (!listResponse.ok) {
    throw new Error("Falha ao listar imagem no ImageKit.")
  }

  const listPayload = (await listResponse.json()) as Array<{
    fileId?: string
    url?: string
  }>

  const normalizedImagePath = normalizeUrlPath(imageUrl)
  const target = listPayload.find((item) => {
    if (!item.fileId || !item.url) return false
    if (item.url === imageUrl) return true

    const itemPath = normalizeUrlPath(item.url)
    return Boolean(normalizedImagePath && itemPath && itemPath === normalizedImagePath)
  })

  if (!target?.fileId) return

  const deleteResponse = await fetch(`https://api.imagekit.io/v1/files/${target.fileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    throw new Error("Falha ao remover imagem no ImageKit.")
  }
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

    const { rpgId, itemId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const items = await prisma.$queryRaw<BaseItemRow[]>(Prisma.sql`
      SELECT
        id,
        rpg_id AS "rpgId",
        name,
        image,
        description,
        type,
        rarity,
        damage,
        "range" AS "range",
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        weight,
        duration,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM baseitems
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    if (items.length === 0) {
      return NextResponse.json({ message: "Item nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({ item: items[0] }, { status: 200 })
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
      if (error.message.includes('column "range" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "duration" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "image" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao buscar item." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId, itemId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const currentRows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
      SELECT image
      FROM baseitems
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)
    if (currentRows.length === 0) {
      return NextResponse.json({ message: "Item nao encontrado." }, { status: 404 })
    }
    const previousImage = currentRows[0]?.image ?? null

    const body = await request.json()
    const parsed = createBaseItemSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const damage = normalizeOptionalText(parsed.data.damage)
    const image = normalizeOptionalText(parsed.data.image)
    const range = normalizeOptionalText(parsed.data.range)
    const description = normalizeOptionalText(parsed.data.description)
    const weight = parsed.data.weight ?? null
    const duration = normalizeOptionalText(parsed.data.duration)
    const durability = parsed.data.durability ?? null
    const abilities = normalizeNamedEntries(parsed.data.abilities)
    const effects = normalizeNamedEntries(parsed.data.effects)
    const abilityName = normalizeOptionalText(parsed.data.abilityName) ?? abilities[0]?.name ?? null
    const ability = normalizeOptionalText(parsed.data.ability) ?? abilities[0]?.description ?? null
    const effectName = normalizeOptionalText(parsed.data.effectName) ?? effects[0]?.name ?? null
    const effect = normalizeOptionalText(parsed.data.effect) ?? effects[0]?.description ?? null

    const updated = await prisma.$queryRaw<BaseItemRow[]>(Prisma.sql`
      UPDATE baseitems
      SET
        name = ${parsed.data.name},
        image = ${image},
        description = ${description},
        type = ${parsed.data.type}::"public"."BaseItemType",
        rarity = ${parsed.data.rarity}::"public"."BaseItemRarity",
        damage = ${damage},
        "range" = ${range},
        ability = ${ability},
        ability_name = ${abilityName},
        effect = ${effect},
        effect_name = ${effectName},
        abilities = ${JSON.stringify(abilities)}::jsonb,
        effects = ${JSON.stringify(effects)}::jsonb,
        weight = ${weight},
        duration = ${duration},
        durability = ${durability},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      RETURNING
        id,
        rpg_id AS "rpgId",
        name,
        image,
        description,
        type,
        rarity,
        damage,
        "range" AS "range",
        ability,
        ability_name AS "abilityName",
        effect,
        effect_name AS "effectName",
        abilities,
        effects,
        weight,
        duration,
        durability,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `)

    if (updated.length === 0) {
      return NextResponse.json({ message: "Item nao encontrado." }, { status: 404 })
    }

    if (previousImage && previousImage !== image) {
      const imageKitConfig = getImageKitConfig()
      if (imageKitConfig.ok) {
        try {
          await deleteImageKitFileByUrl(
            imageKitConfig.privateKey,
            imageKitConfig.urlEndpoint,
            previousImage,
          )
        } catch {
          // Nao bloqueia a atualizacao do item caso a limpeza da imagem falhe.
        }
      }
    }

    return NextResponse.json({ item: updated[0] }, { status: 200 })
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
      if (error.message.includes('column "range" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "duration" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "image" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao atualizar item." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId, itemId } = await context.params
    const hasAccess = await canAccessRpg(rpgId, userId)

    if (!hasAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const deleted = await prisma.$queryRaw<{ id: string; image: string | null }[]>(Prisma.sql`
      DELETE FROM baseitems
      WHERE id = ${itemId}
        AND rpg_id = ${rpgId}
      RETURNING id, image
    `)

    if (deleted.length === 0) {
      return NextResponse.json({ message: "Item nao encontrado." }, { status: 404 })
    }

    const imageKitConfig = getImageKitConfig()
    if (imageKitConfig.ok) {
      try {
        await deleteImageKitFileByUrl(
          imageKitConfig.privateKey,
          imageKitConfig.urlEndpoint,
          deleted[0]?.image ?? null,
        )
      } catch {
        // Nao bloqueia a exclusao do item caso a limpeza da imagem falhe.
      }
    }

    return NextResponse.json(
      { message: "Item deletado com sucesso." },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('relation "baseitems" does not exist')) {
        return NextResponse.json(
          { message: "Tabela baseitems nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
      if (error.message.includes('column "image" does not exist')) {
        return NextResponse.json(
          { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ message: "Erro interno ao deletar item." }, { status: 500 })
  }
}
