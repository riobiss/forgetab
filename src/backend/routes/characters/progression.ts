import {
  grantCharacterPointsUseCase,
  grantCharacterXpUseCase,
} from "@/application/characterProgression/use-cases/characterProgression"
import {
  buyCharacterSkillUseCase,
  removeCharacterSkillUseCase,
} from "@/application/characterAbilities/use-cases/characterSkillPurchase"
import { prismaCharacterProgressionRepository } from "@/infrastructure/characterProgression/repositories/prismaCharacterProgressionRepository"
import { legacyCharacterSkillPurchaseService } from "@/infrastructure/characterAbilities/services/legacyCharacterSkillPurchaseService"
import { rpgCharacterProgressionPermissionService } from "@/infrastructure/characterProgression/services/rpgCharacterProgressionPermissionService"
import { jsonResponse } from "@/backend/http/jsonResponse"
import { toErrorResponse } from "@/backend/shared/errors"
import { type CharacterRouteParams, requireUserId } from "./shared"

const characterProgressionDeps = {
  repository: prismaCharacterProgressionRepository,
  permissionService: rpgCharacterProgressionPermissionService,
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
