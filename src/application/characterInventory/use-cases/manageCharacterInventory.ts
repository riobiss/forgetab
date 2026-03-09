import type { CharacterInventoryRepository } from "@/application/characterInventory/ports/CharacterInventoryRepository"
import { AppError } from "@/shared/errors/AppError"

type Dependencies = {
  repository: CharacterInventoryRepository
}

async function getAccessContext(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; userId: string },
) {
  const rpg = await deps.repository.getRpg(params.rpgId)
  if (!rpg) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  const isOwner = rpg.ownerId === params.userId
  let isModerator = false

  if (!isOwner) {
    const membership = await deps.repository.getMembership(params.rpgId, params.userId)
    if (membership?.status !== "accepted") {
      throw new AppError("RPG nao encontrado.", 404)
    }
    isModerator = membership.role === "moderator"
  }

  const canManageAsMaster = isOwner || isModerator
  const character = await deps.repository.getCharacter(params.rpgId, params.characterId)

  if (!character) {
    throw new AppError("Personagem nao encontrado.", 404)
  }

  const canViewInventory = canManageAsMaster || character.createdByUserId === params.userId

  return {
    isOwner: canManageAsMaster,
    canViewInventory,
  }
}

export async function getCharacterInventoryUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; userId: string },
) {
  const access = await getAccessContext(deps, params)

  if (!access.canViewInventory) {
    throw new AppError("Sem permissao para acessar este inventario.", 403)
  }

  const [weightContext, inventory] = await Promise.all([
    deps.repository.getWeightContext(params.rpgId, params.characterId),
    deps.repository.listInventory(params.rpgId, params.characterId),
  ])

  return {
    inventory,
    isOwner: access.isOwner,
    useInventoryWeightLimit: weightContext.useInventoryWeightLimit,
    maxCarryWeight: weightContext.maxCarryWeight,
  }
}

export async function removeCharacterInventoryItemApiUseCase(
  deps: Dependencies,
  params: {
    rpgId: string
    characterId: string
    userId: string
    inventoryItemId: string
    quantity: number
  },
) {
  const access = await getAccessContext(deps, params)

  if (!access.canViewInventory) {
    throw new AppError("Sem permissao para alterar este inventario.", 403)
  }

  if (!params.inventoryItemId.trim()) {
    throw new AppError("Item de inventario e obrigatorio.", 400)
  }

  if (!Number.isFinite(params.quantity) || Math.floor(params.quantity) < 1) {
    throw new AppError("Quantidade deve ser maior ou igual a 1.", 400)
  }

  const item = await deps.repository.getInventoryItem(
    params.rpgId,
    params.characterId,
    params.inventoryItemId,
  )

  if (!item) {
    throw new AppError("Item nao encontrado no inventario.", 404)
  }

  const quantity = Math.floor(params.quantity)
  const nextQuantity = item.quantity - quantity
  const removedQuantity = quantity > item.quantity ? item.quantity : quantity

  if (nextQuantity <= 0) {
    await deps.repository.deleteInventoryItem(
      params.rpgId,
      params.characterId,
      params.inventoryItemId,
    )

    return {
      message: "Item removido do inventario.",
      inventoryItemId: params.inventoryItemId,
      removedQuantity,
      remainingQuantity: 0,
    }
  }

  await deps.repository.updateInventoryItemQuantity(
    params.rpgId,
    params.characterId,
    params.inventoryItemId,
    nextQuantity,
  )

  return {
    message: "Quantidade do item atualizada.",
    inventoryItemId: params.inventoryItemId,
    removedQuantity,
    remainingQuantity: nextQuantity,
  }
}
