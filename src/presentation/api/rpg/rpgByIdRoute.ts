import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/presentation/api/shared/requestAuth"
import { deleteRpg } from "@/application/rpgManagement/use-cases/deleteRpg"
import { getRpgById } from "@/application/rpgManagement/use-cases/getRpgById"
import { updateRpg } from "@/application/rpgManagement/use-cases/updateRpg"
import { imageKitGateway } from "@/infrastructure/rpgManagement/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/infrastructure/rpgManagement/repositories/prismaRpgRepository"
import { legacyRpgPermissionService } from "@/infrastructure/rpgManagement/services/legacyRpgPermissionService"
import { toErrorResponse } from "@/presentation/api/shared/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

const dependencies = {
  repository: prismaRpgRepository,
  permissionService: legacyRpgPermissionService,
  imageGateway: imageKitGateway,
}

function unauthorized() {
  return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return unauthorized()
  }

  try {
    const { rpgId } = await context.params
    const payload = await getRpgById(
      {
        repository: dependencies.repository,
        permissionService: dependencies.permissionService,
      },
      { rpgId, userId },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar RPG.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return unauthorized()
  }

  try {
    const { rpgId } = await context.params
    const body = await request.json()

    const payload = await updateRpg(dependencies, { rpgId, userId, body })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar RPG.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return unauthorized()
  }

  try {
    const { rpgId } = await context.params
    const payload = await deleteRpg(
      {
        repository: dependencies.repository,
        imageGateway: dependencies.imageGateway,
      },
      { rpgId, userId },
    )

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao deletar RPG.")
  }
}
