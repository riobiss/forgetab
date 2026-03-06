import type { ItemRepository } from "@/application/items/ports/ItemRepository"
import type { RpgPermissionService } from "@/application/items/ports/RpgPermissionService"
import { ensureCanManageRpg, mapBaseItemsError } from "@/application/items/use-cases/shared"
import { AppError } from "@/shared/errors/AppError"

type GiveItemDeps = {
  repository: ItemRepository
  permissionService: RpgPermissionService
}

export async function giveItem(
  deps: GiveItemDeps,
  params: { rpgId: string; userId: string; body: unknown },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(params.rpgId, params.userId)
    ensureCanManageRpg(canManage)

    const body = (params.body ?? {}) as {
      baseItemId?: string
      quantity?: number
      characterIds?: string[]
    }

    const baseItemId = body.baseItemId?.trim() ?? ""
    if (!baseItemId) {
      throw new AppError("Item base e obrigatorio.", 400)
    }

    const quantity = Number.isFinite(body.quantity) ? Math.floor(body.quantity as number) : 1
    if (quantity < 1) {
      throw new AppError("Quantidade deve ser maior ou igual a 1.", 400)
    }

    const characterIds = Array.from(
      new Set(
        (body.characterIds ?? [])
          .map((characterId) => characterId?.trim())
          .filter((characterId): characterId is string => Boolean(characterId)),
      ),
    )

    if (characterIds.length === 0) {
      throw new AppError("Selecione pelo menos um personagem para receber o item.", 400)
    }

    const itemExists = await deps.repository.baseItemExists(params.rpgId, baseItemId)
    if (!itemExists) {
      throw new AppError("Item nao encontrado.", 404)
    }

    const validCharacterIds = new Set(
      await deps.repository.listExistingCharacterIds(params.rpgId, characterIds),
    )
    const hasInvalidCharacters = characterIds.some((characterId) => !validCharacterIds.has(characterId))
    if (hasInvalidCharacters) {
      throw new AppError("Um ou mais personagens selecionados nao sao validos neste RPG.", 400)
    }

    await deps.repository.giveToCharacters({
      rpgId: params.rpgId,
      baseItemId,
      characterIds,
      quantity,
    })

    return {
      message: `Item enviado para ${characterIds.length} personagem(ns).`,
      affectedPlayers: characterIds.length,
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('relation "rpg_character_inventory_items" does not exist')
    ) {
      throw new AppError("Tabela de inventario nao existe no banco. Rode a migration.", 500)
    }

    mapBaseItemsError(error, "Erro interno ao dar item para os players.")
  }
}
