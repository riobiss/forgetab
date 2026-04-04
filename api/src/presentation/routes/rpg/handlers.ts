import { createRpg } from "@/application/rpgManagement/use-cases/createRpg"
import { deleteRpg } from "@/application/rpgManagement/use-cases/deleteRpg"
import { getRpgById } from "@/application/rpgManagement/use-cases/getRpgById"
import { updateRpg } from "@/application/rpgManagement/use-cases/updateRpg"
import { imageKitGateway } from "@/infrastructure/rpgManagement/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/infrastructure/rpgManagement/repositories/prismaRpgRepository"
import { legacyRpgPermissionService } from "@/infrastructure/rpgManagement/services/legacyRpgPermissionService"
import { getAuthPayloadFromRequest } from "@api/presentation/http/auth/requestAuth"
import { toErrorResponse } from "@api/presentation/http/responses/errors"
import { jsonResponse } from "@api/presentation/http/responses/jsonResponse"

type RpgRouteParams = {
  rpgId: string
}

const dependencies = {
  repository: prismaRpgRepository,
  permissionService: legacyRpgPermissionService,
  imageGateway: imageKitGateway,
}

export async function createRpgHandler(request: Request) {
  const authPayload = await getAuthPayloadFromRequest(request)
  if (!authPayload) {
    return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = await createRpg(
      { repository: prismaRpgRepository },
      { userId: authPayload.userId, body },
    )

    return jsonResponse(payload, { status: 201 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao criar RPG.")
  }
}

export async function getRpgByIdHandler(request: Request, params: RpgRouteParams) {
  const authPayload = await getAuthPayloadFromRequest(request)
  if (!authPayload) {
    return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const payload = await getRpgById(
      {
        repository: dependencies.repository,
        permissionService: dependencies.permissionService,
      },
      { rpgId: params.rpgId, userId: authPayload.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar RPG.")
  }
}

export async function updateRpgHandler(request: Request, params: RpgRouteParams) {
  const authPayload = await getAuthPayloadFromRequest(request)
  if (!authPayload) {
    return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = await updateRpg(dependencies, {
      rpgId: params.rpgId,
      userId: authPayload.userId,
      body,
    })

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar RPG.")
  }
}

export async function deleteRpgHandler(request: Request, params: RpgRouteParams) {
  const authPayload = await getAuthPayloadFromRequest(request)
  if (!authPayload) {
    return jsonResponse({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const payload = await deleteRpg(
      {
        repository: dependencies.repository,
        imageGateway: dependencies.imageGateway,
      },
      { rpgId: params.rpgId, userId: authPayload.userId },
    )

    return jsonResponse(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao deletar RPG.")
  }
}
