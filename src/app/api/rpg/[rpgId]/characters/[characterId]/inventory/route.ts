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

type CharacterRow = {
  id: string
  characterType: "player" | "npc" | "monster"
  createdByUserId: string | null
}

type InventoryRow = {
  id: string
  rpgId: string
  characterId: string
  baseItemId: string
  quantity: number
  createdAt: Date
  updatedAt: Date
  itemName: string
  itemType: string
  itemRarity: string
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

async function getCharacterContext(
  rpgId: string,
  characterId: string,
  userId: string,
) {
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

  const characters = await prisma.$queryRaw<CharacterRow[]>(Prisma.sql`
    SELECT
      id,
      character_type AS "characterType",
      created_by_user_id AS "createdByUserId"
    FROM rpg_characters
    WHERE id = ${characterId}
      AND rpg_id = ${rpgId}
    LIMIT 1
  `)

  if (characters.length === 0) {
    return { ok: false as const, status: 404, message: "Personagem nao encontrado." }
  }

  const character = characters[0]
  const canViewInventory = isOwner || character.createdByUserId === userId

  return {
    ok: true as const,
    isOwner,
    canViewInventory,
    character,
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const characterContext = await getCharacterContext(rpgId, characterId, userId)

    if (!characterContext.ok) {
      return NextResponse.json(
        { message: characterContext.message },
        { status: characterContext.status },
      )
    }

    if (!characterContext.canViewInventory) {
      return NextResponse.json(
        { message: "Sem permissao para acessar este inventario." },
        { status: 403 },
      )
    }

    const inventoryItems = await prisma.$queryRaw<InventoryRow[]>(Prisma.sql`
      SELECT
        i.id,
        i.rpg_id AS "rpgId",
        i.character_id AS "characterId",
        i.base_item_id AS "baseItemId",
        i.quantity,
        i.created_at AS "createdAt",
        i.updated_at AS "updatedAt",
        b.name AS "itemName",
        b.type AS "itemType",
        b.rarity AS "itemRarity"
      FROM rpg_character_inventory_items i
      INNER JOIN baseitems b ON b.id = i.base_item_id
      WHERE i.rpg_id = ${rpgId}
        AND i.character_id = ${characterId}
      ORDER BY i.created_at DESC
    `)

    return NextResponse.json(
      { inventory: inventoryItems, isOwner: characterContext.isOwner },
      { status: 200 },
    )
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_inventory_items" does not exist')
    ) {
      return NextResponse.json(
        { message: "Tabela de inventario nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao consultar inventario." },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  void request
  void context

  return NextResponse.json(
    { message: "Dar item por esta rota foi desativado. Use a pagina de itens do RPG." },
    { status: 405 },
  )
}
