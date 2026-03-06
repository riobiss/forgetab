import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "../../../../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"
import { getRpgPermission } from "@/lib/server/rpgPermissions"
import { revalidateItemsListTags } from "@/presentation/api/items/cacheTags"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
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

async function canManageRpg(rpgId: string, userId: string) {
  const permission = await getRpgPermission(rpgId, userId)
  return permission.canManage
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const ownerAccess = await canManageRpg(rpgId, userId)

    if (!ownerAccess) {
      return NextResponse.json({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = (await request.json()) as {
      baseItemId?: string
      quantity?: number
      characterIds?: string[]
    }

    const baseItemId = body.baseItemId?.trim() ?? ""
    if (!baseItemId) {
      return NextResponse.json({ message: "Item base e obrigatorio." }, { status: 400 })
    }

    const quantity = Number.isFinite(body.quantity) ? Math.floor(body.quantity as number) : 1
    if (quantity < 1) {
      return NextResponse.json(
        { message: "Quantidade deve ser maior ou igual a 1." },
        { status: 400 },
      )
    }

    const selectedCharacterIds = Array.from(
      new Set(
        (body.characterIds ?? [])
          .map((characterId) => characterId?.trim())
          .filter((characterId): characterId is string => Boolean(characterId)),
      ),
    )

    if (selectedCharacterIds.length === 0) {
      return NextResponse.json(
        { message: "Selecione pelo menos um personagem para receber o item." },
        { status: 400 },
      )
    }

    const baseItem = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM baseitems
      WHERE id = ${baseItemId}
        AND rpg_id = ${rpgId}
      LIMIT 1
    `)

    if (baseItem.length === 0) {
      return NextResponse.json({ message: "Item nao encontrado." }, { status: 404 })
    }

    const validCharacters = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_characters
      WHERE rpg_id = ${rpgId}
        AND id IN (${Prisma.join(selectedCharacterIds)})
    `)

    const validCharacterIds = new Set(validCharacters.map((character) => character.id))
    const invalidCharacters = selectedCharacterIds.filter(
      (characterId) => !validCharacterIds.has(characterId),
    )

    if (invalidCharacters.length > 0) {
      return NextResponse.json(
        { message: "Um ou mais personagens selecionados nao sao validos neste RPG." },
        { status: 400 },
      )
    }

    await prisma.$transaction(
      selectedCharacterIds.map((characterId) =>
        prisma.$executeRaw(Prisma.sql`
          INSERT INTO rpg_character_inventory_items (
            id,
            rpg_id,
            character_id,
            base_item_id,
            quantity
          )
          VALUES (
            ${crypto.randomUUID()},
            ${rpgId},
            ${characterId},
            ${baseItemId},
            ${quantity}
          )
          ON CONFLICT (character_id, base_item_id)
          DO UPDATE SET
            quantity = rpg_character_inventory_items.quantity + EXCLUDED.quantity,
            updated_at = CURRENT_TIMESTAMP
        `),
      ),
    )

    revalidateItemsListTags({ userId, rpgId })

    return NextResponse.json(
      {
        message: `Item enviado para ${selectedCharacterIds.length} personagem(ns).`,
        affectedPlayers: selectedCharacterIds.length,
      },
      { status: 201 },
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

    if (error instanceof Error && error.message.includes('relation "baseitems" does not exist')) {
      return NextResponse.json(
        { message: "Tabela baseitems nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { message: "Erro interno ao dar item para os players." },
      { status: 500 },
    )
  }
}
