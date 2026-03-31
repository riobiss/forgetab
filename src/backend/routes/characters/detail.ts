import { deleteCharacter } from "@/application/characters/use-cases/deleteCharacter"
import {
  updateCharacter,
  type UpdateCharacterPayload,
} from "@/application/characters/use-cases/updateCharacter"
import { legacyCharacterManagementService } from "@/infrastructure/characters/services/legacyCharacterManagementService"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { getCharacterEditorSnapshot } from "@/lib/server/characters/getCharacterEditorSnapshot"
import { canManageCharacter } from "@/lib/server/characters/manage/permissions"
import { type CharacterInventoryRouteParams, requireUserId } from "./shared"

export async function getCharacterByIdHandler(request: Request, params: CharacterInventoryRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const permission = await canManageCharacter(params.rpgId, params.characterId, auth.userId)
    if (!permission.ok) {
      return jsonResponse({ message: permission.message }, { status: permission.status })
    }

    const character = await getCharacterEditorSnapshot(params.rpgId, params.characterId)
    if (!character) {
      return jsonResponse({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return jsonResponse({ character }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar personagem.")
  }
}

export async function updateCharacterHandler(request: Request, params: CharacterInventoryRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const payload = (await request.json()) as UpdateCharacterPayload
    await updateCharacter(
      { managementService: legacyCharacterManagementService },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        payload,
      },
    )

    const updatedCharacter = await getCharacterEditorSnapshot(params.rpgId, params.characterId)

    return jsonResponse(
      updatedCharacter
        ? { message: "Personagem atualizado com sucesso.", character: updatedCharacter }
        : { message: "Personagem atualizado com sucesso." },
      { status: 200 },
    )
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar personagem.")
  }
}

export async function deleteCharacterHandler(request: Request, params: CharacterInventoryRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    await deleteCharacter(
      { managementService: legacyCharacterManagementService },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
      },
    )

    return jsonResponse({ message: "Personagem deletado com sucesso." }, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao deletar personagem.")
  }
}
