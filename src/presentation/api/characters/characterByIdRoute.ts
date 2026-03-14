import { NextRequest, NextResponse } from "next/server"
import { deleteCharacter } from "@/application/characters/use-cases/deleteCharacter"
import {
  updateCharacter,
  type UpdateCharacterPayload,
} from "@/application/characters/use-cases/updateCharacter"
import { legacyCharacterManagementService } from "@/infrastructure/characters/services/legacyCharacterManagementService"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { canManageCharacter } from "@/lib/server/characters/manage/permissions"
import { getCharacterEditorSnapshot } from "@/lib/server/characters/getCharacterEditorSnapshot"
import { AppError } from "@/shared/errors/AppError"

type RouteContext = {
  params: Promise<{
    rpgId: string
    characterId: string
  }>
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, characterId } = await context.params
    const permission = await canManageCharacter(rpgId, characterId, userId)
    if (!permission.ok) {
      return NextResponse.json({ message: permission.message }, { status: permission.status })
    }

    const character = await getCharacterEditorSnapshot(rpgId, characterId)
    if (!character) {
      return NextResponse.json({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return NextResponse.json({ character }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar personagem.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, characterId } = await context.params
    const payload = (await request.json()) as UpdateCharacterPayload
    await updateCharacter(
      { managementService: legacyCharacterManagementService },
      {
        rpgId,
        characterId,
        userId,
        payload,
      },
    )
    const updatedCharacter = await getCharacterEditorSnapshot(rpgId, characterId)

    return NextResponse.json(
      updatedCharacter
        ? { message: "Personagem atualizado com sucesso.", character: updatedCharacter }
        : { message: "Personagem atualizado com sucesso." },
      { status: 200 },
    )
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar personagem.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const { rpgId, characterId } = await context.params
    await deleteCharacter(
      { managementService: legacyCharacterManagementService },
      {
        rpgId,
        characterId,
        userId,
      },
    )

    return NextResponse.json({ message: "Personagem deletado com sucesso." }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao deletar personagem.")
  }
}
