import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server/auth"
import {
  updateCharacter,
  UpdateCharacterError,
  type UpdateCharacterPayload,
} from "@/lib/server/characters/updateCharacter"
import {
  deleteCharacter,
  DeleteCharacterError,
} from "@/lib/server/characters/deleteCharacter"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    const payload = (await request.json()) as UpdateCharacterPayload
    await updateCharacter({
      rpgId,
      characterId,
      userId,
      payload,
    })

    return NextResponse.json({ message: "Personagem atualizado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof UpdateCharacterError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { message: "Erro interno ao atualizar personagem." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, characterId } = await context.params
    await deleteCharacter({
      rpgId,
      characterId,
      userId,
    })

    return NextResponse.json({ message: "Personagem deletado com sucesso." }, { status: 200 })
  } catch (error) {
    if (error instanceof DeleteCharacterError) {
      return NextResponse.json({ message: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { message: "Erro interno ao deletar personagem." },
      { status: 500 },
    )
  }
}
