import {
  grantCharacterPointsUseCase,
  grantCharacterXpUseCase,
} from "@/application/characterProgression/use-cases/characterProgression"
import {
  getCharacterInventoryUseCase,
  removeCharacterInventoryItemApiUseCase,
} from "@/application/characterInventory/use-cases/manageCharacterInventory"
import { updateCharacterStatusCurrentUseCase } from "@/application/characterStatusCurrent/use-cases/characterStatusCurrent"
import { loadCharacterAbilitiesUseCase } from "@/application/characterAbilities/use-cases/characterAbilities"
import {
  addNpcMonsterCharacterAbilityUseCase,
  removeNpcMonsterCharacterAbilityUseCase,
} from "@/application/characterAbilities/use-cases/npcMonsterCharacterAbilities"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase,
} from "@/application/characterAbilities/use-cases/characterSkillPurchase"
import { createCharacter } from "@/application/characters/use-cases/createCharacter"
import { deleteCharacter } from "@/application/characters/use-cases/deleteCharacter"
import { getRpgAccess } from "@/application/characters/use-cases/getRpgAccess"
import { listCharacters } from "@/application/characters/use-cases/listCharacters"
import {
  updateCharacter,
  type UpdateCharacterPayload,
} from "@/application/characters/use-cases/updateCharacter"
import { prismaCharacterAbilitiesRepository } from "@/infrastructure/characterAbilities/repositories/prismaCharacterAbilitiesRepository"
import { legacyCharacterAbilitiesParserService } from "@/infrastructure/characterAbilities/services/legacyCharacterAbilitiesParserService"
import { npcMonsterCharacterAbilityService } from "@/infrastructure/characterAbilities/services/npcMonsterCharacterAbilityService"
import { legacyCharacterSkillPurchaseService } from "@/infrastructure/characterAbilities/services/legacyCharacterSkillPurchaseService"
import { prismaCharacterInventoryRepository } from "@/infrastructure/characterInventory/repositories/prismaCharacterInventoryRepository"
import { prismaCharacterProgressionRepository } from "@/infrastructure/characterProgression/repositories/prismaCharacterProgressionRepository"
import { prismaCharacterStatusCurrentRepository } from "@/infrastructure/characterStatusCurrent/repositories/prismaCharacterStatusCurrentRepository"
import { prismaCharacterRepository } from "@/infrastructure/characters/repositories/prismaCharacterRepository"
import { prismaRpgAccessRepository } from "@/infrastructure/characters/repositories/prismaRpgAccessRepository"
import { prismaRpgTemplatesRepository } from "@/infrastructure/characters/repositories/prismaRpgTemplatesRepository"
import { legacyCharacterManagementService } from "@/infrastructure/characters/services/legacyCharacterManagementService"
import { rpgCharacterProgressionPermissionService } from "@/infrastructure/characterProgression/services/rpgCharacterProgressionPermissionService"
import { getUserIdFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"
import { getCharacterEditorSnapshot } from "@/lib/server/characters/getCharacterEditorSnapshot"
import { canManageCharacter } from "@/lib/server/characters/manage/permissions"

type CharacterRouteParams = {
  id: string
}

type CharacterInventoryRouteParams = {
  rpgId: string
  characterId: string
}

type CharactersCollectionRouteParams = {
  rpgId: string
}

const characterProgressionDeps = {
  repository: prismaCharacterProgressionRepository,
  permissionService: rpgCharacterProgressionPermissionService,
}

function mapCharacterInventoryError(error: unknown, fallbackMessage: string) {
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

function mapCharacterCollectionError(error: unknown, fallbackMessage: string) {
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

async function requireUserId(request: Request) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return { ok: false as const, response: jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 }) }
  }

  return { ok: true as const, userId }
}

export async function grantCharacterXpHandler(request: Request, params: CharacterRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as { amount?: unknown }
    const payload = await grantCharacterXpUseCase(characterProgressionDeps, {
      characterId: params.id,
      userId: auth.userId,
      amount: body.amount,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao conceder XP.")
  }
}

export async function grantCharacterPointsHandler(request: Request, params: CharacterRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as { amount?: unknown }
    const payload = await grantCharacterPointsUseCase(characterProgressionDeps, {
      characterId: params.id,
      userId: auth.userId,
      amount: body.amount,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao conceder pontos.")
  }
}

export async function buyCharacterSkillHandler(request: Request, params: CharacterRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await buyCharacterSkillUseCase(
      { service: legacyCharacterSkillPurchaseService },
      { characterId: params.id, userId: auth.userId, payload: await request.json() },
    )

    return jsonResponse(payload, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao comprar habilidade.")
  }
}

export async function removeCharacterSkillHandler(request: Request, params: CharacterRouteParams) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await removeCharacterSkillUseCase(
      { service: legacyCharacterSkillPurchaseService },
      { characterId: params.id, userId: auth.userId, payload: await request.json() },
    )

    return jsonResponse(payload, { status: payload.status })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover habilidade.")
  }
}

export async function getCharacterInventoryHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await getCharacterInventoryUseCase(
      { repository: prismaCharacterInventoryRepository },
      { rpgId: params.rpgId, characterId: params.characterId, userId: auth.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return mapCharacterInventoryError(error, "Erro interno ao consultar inventario.")
  }
}

export async function createCharacterInventoryHandler() {
  return jsonResponse(
    { message: "Dar item por esta rota foi desativado. Use a pagina de itens do RPG." },
    { status: 405 },
  )
}

export async function removeCharacterInventoryHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const body = (await request.json()) as {
      inventoryItemId?: string
      quantity?: number
    }

    const payload = await removeCharacterInventoryItemApiUseCase(
      { repository: prismaCharacterInventoryRepository },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        inventoryItemId: body.inventoryItemId?.trim() ?? "",
        quantity: Number.isFinite(body.quantity) ? Math.floor(body.quantity as number) : 1,
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return mapCharacterInventoryError(error, "Erro interno ao remover item do inventario.")
  }
}

export async function updateCharacterStatusCurrentHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = (await request.json()) as { key?: unknown; value?: unknown }

    const payload = await updateCharacterStatusCurrentUseCase(
      prismaCharacterStatusCurrentRepository,
      { rpgId: params.rpgId, characterId: params.characterId, userId: auth.userId, body },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
      return jsonResponse(
        { message: "Tabela de personagens nao existe no banco. Rode a migration." },
        { status: 500 },
      )
    }
    if (error instanceof Error && error.message.includes('column "current_statuses" does not exist')) {
      return jsonResponse(
        { message: "Estrutura de personagens desatualizada. Rode a migration mais recente." },
        { status: 500 },
      )
    }

    return toErrorResponse(error, "Erro interno ao salvar status atual.")
  }
}

export async function listCharactersHandler(request: Request, params: CharactersCollectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: params.rpgId,
      userId: auth.userId,
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return jsonResponse({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const payload = await listCharacters({
      rpgId: params.rpgId,
      userId: auth.userId,
      access,
      characterRepository: prismaCharacterRepository,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return mapCharacterCollectionError(error, "Erro interno ao listar personagens.")
  }
}

export async function createCharacterHandler(request: Request, params: CharactersCollectionRouteParams) {
  const auth = await requireUserId(request)
  if (!auth.ok) {
    return auth.response
  }

  try {
    const access = await getRpgAccess({
      rpgId: params.rpgId,
      userId: auth.userId,
      repository: prismaRpgAccessRepository,
    })

    if (!access.exists || !access.canAccess) {
      return jsonResponse({ message: "RPG nao encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const character = await createCharacter({
      rpgId: params.rpgId,
      userId: auth.userId,
      access,
      payload: body,
      characterRepository: prismaCharacterRepository,
      rpgTemplatesRepository: prismaRpgTemplatesRepository,
    })

    return jsonResponse({ character }, { status: 201 })
  } catch (error) {
    return mapCharacterCollectionError(error, "Erro interno ao criar personagem.")
  }
}

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

export async function getNpcMonsterCharacterAbilitiesHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await loadCharacterAbilitiesUseCase(
      {
        repository: prismaCharacterAbilitiesRepository,
        rpgAccessRepository: prismaRpgAccessRepository,
        parserService: legacyCharacterAbilitiesParserService,
      },
      { rpgId: params.rpgId, characterId: params.characterId, userId: auth.userId },
    )

    if (!payload) {
      return jsonResponse({ message: "Personagem nao encontrado." }, { status: 404 })
    }

    return jsonResponse(
      {
        characterName: payload.characterName,
        abilities: payload.abilities,
      },
      { status: 200 },
    )
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar habilidades.")
  }
}

export async function addNpcMonsterCharacterAbilityHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await addNpcMonsterCharacterAbilityUseCase(
      { service: npcMonsterCharacterAbilityService },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        payload: await request.json(),
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao adicionar habilidade.")
  }
}

export async function removeNpcMonsterCharacterAbilityHandler(
  request: Request,
  params: CharacterInventoryRouteParams,
) {
  try {
    const auth = await requireUserId(request)
    if (!auth.ok) {
      return auth.response
    }

    const payload = await removeNpcMonsterCharacterAbilityUseCase(
      { service: npcMonsterCharacterAbilityService },
      {
        rpgId: params.rpgId,
        characterId: params.characterId,
        userId: auth.userId,
        payload: await request.json(),
      },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover habilidade.")
  }
}
