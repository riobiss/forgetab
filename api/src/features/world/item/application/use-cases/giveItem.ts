import { z } from "zod"
import type { ItemDistributionRepository } from "@/features/world/item/application/ports/ItemRepository"
import type { RpgPermissionService } from "@/features/world/item/application/ports/RpgPermissionService"
import { ensureCanManageRpg, mapBaseItemsError } from "@/features/world/item/application/use-cases/shared"
import { AppError } from "@/features/shared/application/errors/AppError"

const giveItemSchema = z.object({
  baseItemId: z.string().trim().min(1, "Item base e obrigatorio."),
  quantity: z
    .number({ message: "Quantidade invalida." })
    .finite("Quantidade invalida.")
    .int("Quantidade deve ser um numero inteiro.")
    .min(1, "Quantidade deve ser maior ou igual a 1.")
    .default(1),
  characterIds: z
    .array(z.string(), { message: "Lista de personagens invalida." })
    .min(1, "Selecione pelo menos um personagem para receber o item."),
})

type GiveItemDeps = {
  repository: ItemDistributionRepository
  permissionService: RpgPermissionService
}

export async function giveItem(
  deps: GiveItemDeps,
  params: { rpgId: string; userId: string; body: unknown },
) {
  try {
    const canManage = await deps.permissionService.canManageRpg(params.rpgId, params.userId)
    ensureCanManageRpg(canManage)

    const parsed = giveItemSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Dados invalidos.",
        400,
      )
    }

    const { baseItemId, quantity } = parsed.data
    const characterIds = Array.from(
      new Set(
        parsed.data.characterIds
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
    mapBaseItemsError(error, "Erro interno ao dar item para os players.")
  }
}
