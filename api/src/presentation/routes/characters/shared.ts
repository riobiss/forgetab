import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

export type CharacterRouteParams = {
  id: string
}

export type CharacterInventoryRouteParams = {
  rpgId: string
  characterId: string
}

export type CharactersCollectionRouteParams = {
  rpgId: string
}

export async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return {
      ok: false as const,
      response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }),
    }
  }

  return { ok: true as const, userId }
}

export function mapCharacterInventoryError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    error.message.includes('relation "rpg_character_inventory_items" does not exist')
  ) {
    return jsonResponse(
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
    return jsonResponse(
      { message: "Estrutura de itens desatualizada. Rode a migration mais recente." },
      { status: 500 },
    )
  }

  return toErrorResponse(error, fallbackMessage)
}

export function mapCharacterCollectionError(error: unknown, fallbackMessage: string) {
  if (
    error instanceof Error &&
    (error.message.includes('column "use_inventory_weight_limit" does not exist') ||
      error.message.includes('column "allow_multiple_player_characters" does not exist') ||
      error.message.includes('column "progression_mode" does not exist') ||
      error.message.includes('column "progression_tiers" does not exist'))
  ) {
    return jsonResponse(
      { message: "Estrutura de RPG desatualizada. Rode a migration mais recente." },
      { status: 500 },
    )
  }

  return toErrorResponse(error, fallbackMessage)
}
