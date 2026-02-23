import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { createRpgSchema } from "@/lib/validators/rpg"
import { getUserIdFromRequest } from "@/lib/server/auth"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

function getImageKitConfig() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT

  if (!privateKey || !urlEndpoint) {
    return { ok: false as const }
  }

  return { ok: true as const, privateKey, urlEndpoint }
}

function buildRpgFolder(userId: string) {
  return `/forgetab/users/${userId}/rpgs`
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
  allowedFolderPaths: string[],
) {
  if (!rawUrl) return

  const imageUrl = rawUrl.trim()
  if (!imageUrl) return

  const endpointHost = parseHost(urlEndpoint)
  const imageUrlHost = parseHost(imageUrl)
  if (!endpointHost || !imageUrlHost || endpointHost !== imageUrlHost) {
    return
  }

  const normalizedImagePath = normalizeUrlPath(imageUrl)
  const allowedPrefixes = allowedFolderPaths
    .map((folder) => folder.trim())
    .filter((folder) => folder.length > 0)
    .map((folder) => (folder.endsWith("/") ? folder : `${folder}/`))

  if (
    !normalizedImagePath ||
    allowedPrefixes.length === 0 ||
    !allowedPrefixes.some((prefix) => normalizedImagePath.startsWith(prefix))
  ) {
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

  const target = listPayload.find((item) => {
    if (!item.fileId || !item.url) return false
    if (item.url === imageUrl) return true

    const itemPath = normalizeUrlPath(item.url)
    return Boolean(
      normalizedImagePath &&
        itemPath &&
        itemPath === normalizedImagePath &&
        allowedPrefixes.some((prefix) => itemPath.startsWith(prefix)),
    )
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

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

type RpgRow = {
  id: string
  ownerId: string
  title: string
  description: string
  image: string | null
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  useMundiMap: boolean
  useRaceBonuses: boolean
  useClassBonuses: boolean
  useClassRaceBonuses: boolean
  useInventoryWeightLimit: boolean
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params

    let rows: RpgRow[] = []
    try {
      rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
        SELECT
          id,
          owner_id AS "ownerId",
          title,
          description,
          image,
          visibility,
          COALESCE(costs_enabled, false) AS "costsEnabled",
          COALESCE(NULLIF(TRIM(cost_resource_name), ''), 'Skill Points') AS "costResourceName",
          COALESCE(use_mundi_map, false) AS "useMundiMap",
          COALESCE(use_race_bonuses, COALESCE(use_class_race_bonuses, false)) AS "useRaceBonuses",
          COALESCE(use_class_bonuses, COALESCE(use_class_race_bonuses, false)) AS "useClassBonuses",
          COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses",
          COALESCE(use_inventory_weight_limit, false) AS "useInventoryWeightLimit"
        FROM rpgs
        WHERE id = ${rpgId}
        LIMIT 1
      `)
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('column "costs_enabled" does not exist') ||
          error.message.includes('column "cost_resource_name" does not exist') ||
          error.message.includes('column "image" does not exist') ||
          error.message.includes('column "use_race_bonuses" does not exist') ||
          error.message.includes('column "use_class_bonuses" does not exist') ||
          error.message.includes('column "use_class_race_bonuses" does not exist') ||
          error.message.includes('column "use_inventory_weight_limit" does not exist') ||
          error.message.includes('column "use_mundi_map" does not exist'))
      ) {
        try {
          rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
            SELECT
              id,
              owner_id AS "ownerId",
              title,
              description,
              null::text AS image,
              visibility,
              false AS "costsEnabled",
              'Skill Points' AS "costResourceName",
              false AS "useMundiMap",
              COALESCE(use_class_race_bonuses, false) AS "useRaceBonuses",
              COALESCE(use_class_race_bonuses, false) AS "useClassBonuses",
              COALESCE(use_class_race_bonuses, false) AS "useClassRaceBonuses",
              false AS "useInventoryWeightLimit"
            FROM rpgs
            WHERE id = ${rpgId}
            LIMIT 1
          `)
        } catch {
          rows = await prisma.$queryRaw<RpgRow[]>(Prisma.sql`
            SELECT
              id,
              owner_id AS "ownerId",
              title,
              description,
              null::text AS image,
              visibility,
              false AS "costsEnabled",
              'Skill Points' AS "costResourceName",
              false AS "useMundiMap",
              false AS "useRaceBonuses",
              false AS "useClassBonuses",
              false AS "useClassRaceBonuses",
              false AS "useInventoryWeightLimit"
            FROM rpgs
            WHERE id = ${rpgId}
            LIMIT 1
          `)
        }
      } else {
        throw error
      }
    }
    const rpg = rows[0]

    if (!rpg) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    const isOwner = rpg.ownerId === userId
    let isAcceptedMember = false

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

      isAcceptedMember = membership?.status === "accepted"
    }

    if (!isOwner && rpg.visibility === "private" && !isAcceptedMember) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    return NextResponse.json(
      {
        rpg: {
          id: rpg.id,
          title: rpg.title,
          description: rpg.description,
          image: rpg.image,
          visibility: rpg.visibility,
          costsEnabled: rpg.costsEnabled,
          costResourceName: rpg.costResourceName,
          useMundiMap: rpg.useMundiMap,
          useRaceBonuses: rpg.useRaceBonuses,
          useClassBonuses: rpg.useClassBonuses,
          useClassRaceBonuses: rpg.useClassRaceBonuses,
          useInventoryWeightLimit: rpg.useInventoryWeightLimit,
        },
      },
      { status: 200 },
    )
  } catch {
    return NextResponse.json(
      { message: "Erro interno ao carregar RPG." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const body = await request.json()
    const safeBody =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {}
    const requestedCostsUpdate =
      Object.prototype.hasOwnProperty.call(safeBody, "costsEnabled") ||
      Object.prototype.hasOwnProperty.call(safeBody, "costResourceName")
    const hasImageInBody = Object.prototype.hasOwnProperty.call(safeBody, "image")
    if (requestedCostsUpdate) {
      return NextResponse.json(
        { message: "Configuracao de custos disponivel apenas na criacao do RPG." },
        { status: 400 },
      )
    }
    const parsed = createRpgSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Dados invalidos." },
        { status: 400 },
      )
    }

    const { rpgId } = await context.params
    const {
      title,
      description,
      image,
      visibility,
      useMundiMap,
      useRaceBonuses,
      useClassBonuses,
      useClassRaceBonuses,
      useInventoryWeightLimit,
    } = parsed.data
    const resolvedUseRaceBonuses =
      typeof useRaceBonuses === "boolean"
        ? useRaceBonuses
        : Boolean(useClassRaceBonuses)
    const resolvedUseClassBonuses =
      typeof useClassBonuses === "boolean"
        ? useClassBonuses
        : Boolean(useClassRaceBonuses)
    const normalizedImage = normalizeOptionalText(image)
    let previousImage: string | null = null

    if (hasImageInBody) {
      try {
        const currentRows = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
          SELECT image
          FROM rpgs
          WHERE id = ${rpgId}
            AND owner_id = ${userId}
          LIMIT 1
        `)
        previousImage = currentRows[0]?.image ?? null
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('column "image" does not exist')
        ) {
          return NextResponse.json(
            { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
            { status: 500 },
          )
        }

        throw error
      }
    }

    const updated = await prisma.rpg.updateMany({
      where: { id: rpgId, ownerId: userId },
      data: { title, description, visibility },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    if (
      typeof useMundiMap === "boolean" ||
      typeof useRaceBonuses === "boolean" ||
      typeof useClassBonuses === "boolean" ||
      typeof useClassRaceBonuses === "boolean" ||
      typeof useInventoryWeightLimit === "boolean"
    ) {
      try {
        await prisma.$executeRaw(Prisma.sql`
          UPDATE rpgs
          SET
            use_mundi_map = ${Boolean(useMundiMap)},
            use_race_bonuses = ${resolvedUseRaceBonuses},
            use_class_bonuses = ${resolvedUseClassBonuses},
            use_class_race_bonuses = ${resolvedUseRaceBonuses || resolvedUseClassBonuses},
            use_inventory_weight_limit = ${Boolean(useInventoryWeightLimit)}
          WHERE id = ${rpgId}
            AND owner_id = ${userId}
        `)
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('column "use_race_bonuses" does not exist') ||
            error.message.includes('column "use_class_bonuses" does not exist')
          ) {
            try {
              await prisma.$executeRaw(Prisma.sql`
                UPDATE rpgs
                SET
                  use_mundi_map = ${Boolean(useMundiMap)},
                  use_class_race_bonuses = ${resolvedUseRaceBonuses || resolvedUseClassBonuses},
                  use_inventory_weight_limit = ${Boolean(useInventoryWeightLimit)}
                WHERE id = ${rpgId}
                  AND owner_id = ${userId}
              `)
            } catch (innerError) {
              if (
                !(innerError instanceof Error) ||
                (!innerError.message.includes('column "use_class_race_bonuses" does not exist') &&
                  !innerError.message.includes('column "use_inventory_weight_limit" does not exist') &&
                  !innerError.message.includes('column "use_mundi_map" does not exist'))
              ) {
                throw innerError
              }
            }
          } else if (
            !error.message.includes('column "use_class_race_bonuses" does not exist') &&
            !error.message.includes('column "use_inventory_weight_limit" does not exist') &&
            !error.message.includes('column "use_mundi_map" does not exist')
          ) {
            throw error
          }
        } else {
          throw error
        }
      }
    }

    if (hasImageInBody) {
      try {
        const updatedRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          UPDATE rpgs
          SET image = ${normalizedImage}
          WHERE id = ${rpgId}
            AND owner_id = ${userId}
          RETURNING id
        `)

        if (updatedRows.length === 0) {
          return NextResponse.json(
            { message: "RPG nao encontrado." },
            { status: 404 },
          )
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('column "image" does not exist')) {
          return NextResponse.json(
            { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
            { status: 500 },
          )
        }

        throw error
      }

      if (previousImage && previousImage !== normalizedImage) {
        const imageKitConfig = getImageKitConfig()
        if (imageKitConfig.ok) {
          const allowedFolderPaths = [buildRpgFolder(userId)]
          try {
            await deleteImageKitFileByUrl(
              imageKitConfig.privateKey,
              imageKitConfig.urlEndpoint,
              previousImage,
              allowedFolderPaths,
            )
          } catch {
            // Nao bloqueia a atualizacao do RPG caso a limpeza da imagem falhe.
          }
        }
      }
    }

    return NextResponse.json(
      { message: "RPG atualizado com sucesso." },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    if (error instanceof Error) {
      if (
        error.message.includes('relation "rpgs" does not exist') ||
        error.message.includes('column "costs_enabled" does not exist') ||
        error.message.includes('column "cost_resource_name" does not exist') ||
        error.message.includes('column "image" does not exist') ||
        error.message.includes("Could not find the table")
      ) {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao atualizar RPG." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)

    if (!userId) {
      return NextResponse.json(
        { message: "Usuario nao autenticado." },
        { status: 401 },
      )
    }

    const { rpgId } = await context.params
    let imageUrl: string | null = null

    try {
      const currentRpg = await prisma.$queryRaw<Array<{ image: string | null }>>(Prisma.sql`
        SELECT image
        FROM rpgs
        WHERE id = ${rpgId}
          AND owner_id = ${userId}
        LIMIT 1
      `)
      imageUrl = currentRpg[0]?.image ?? null
    } catch (error) {
      if (
        !(
          error instanceof Error &&
          error.message.includes('column "image" does not exist')
        )
      ) {
        throw error
      }
    }

    const deleted = await prisma.rpg.deleteMany({
      where: { id: rpgId, ownerId: userId },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { message: "RPG nao encontrado." },
        { status: 404 },
      )
    }

    const imageKitConfig = getImageKitConfig()
    if (imageKitConfig.ok) {
      const allowedFolderPaths = [buildRpgFolder(userId)]
      try {
        await deleteImageKitFileByUrl(
          imageKitConfig.privateKey,
          imageKitConfig.urlEndpoint,
          imageUrl,
          allowedFolderPaths,
        )
      } catch {
        // Nao bloqueia a exclusao do RPG caso a limpeza da imagem falhe.
      }
    }

    return NextResponse.json({ message: "RPG deletado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    if (error instanceof Error) {
      if (
        error.message.includes('relation "rpgs" does not exist') ||
        error.message.includes('column "image" does not exist') ||
        error.message.includes("Could not find the table")
      ) {
        return NextResponse.json(
          { message: "Tabela de RPG nao existe no banco. Rode a migration." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json(
      { message: "Erro interno ao deletar RPG." },
      { status: 500 },
    )
  }
}
