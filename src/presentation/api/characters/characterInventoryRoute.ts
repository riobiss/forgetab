import { NextRequest, NextResponse } from "next/server"
import { getCharacterInventoryUseCase, removeCharacterInventoryItemApiUseCase } from "@/application/characterInventory/use-cases/manageCharacterInventory"
import { prismaCharacterInventoryRepository } from "@/infrastructure/characterInventory/repositories/prismaCharacterInventoryRepository"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

function mapInventoryError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    error.message.includes('relation "rpg_character_inventory_items" does not exist')
  ) {
    return NextResponse.json(
      { message: "Tabela de inventario nao existe no banco. Rode a migration." },
      { status: 500 },
    )
  }

  if (
    error instanceof Error &&
    (error.message.includes('column "description" does not exist') ||
      error.message.includes('column "pre_requirement" does not exist') ||
      error.message.includes('column "duration" does not exist') ||
      error.message.includes('column "image" does not exist'))
  ) {
    return NextResponse.json(
      { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
      { status: 500 },
    )
  }

  return toErrorResponse(error, fallbackMessage)
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const payload = await getCharacterInventoryUseCase(
      { repository: prismaCharacterInventoryRepository },
      { rpgId, characterId, userId },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return mapInventoryError(error, "Erro interno ao consultar inventario.")
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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const body = (await request.json()) as {
      inventoryItemId?: string
      quantity?: number
    }

    const payload = await removeCharacterInventoryItemApiUseCase(
      { repository: prismaCharacterInventoryRepository },
      {
        rpgId,
        characterId,
        userId,
        inventoryItemId: body.inventoryItemId?.trim() ?? "",
        quantity: Number.isFinite(body.quantity) ? Math.floor(body.quantity as number) : 1,
      },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return mapInventoryError(error, "Erro interno ao remover item do inventario.")
  }
}
