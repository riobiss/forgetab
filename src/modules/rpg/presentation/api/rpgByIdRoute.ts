import { NextRequest, NextResponse } from "next/server"
import { getUserIdFromRequest } from "@/lib/server/auth"
import { getRpgById } from "@/modules/rpg/application/useCases/getRpgById"
import { updateRpg } from "@/modules/rpg/application/useCases/updateRpg"
import { deleteRpg } from "@/modules/rpg/application/useCases/deleteRpg"
import { AppError } from "@/modules/rpg/domain/errors"
import { imageKitGateway } from "@/modules/rpg/infrastructure/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/modules/rpg/infrastructure/repositories/prismaRpgRepository"
import { legacyRpgPermissionService } from "@/modules/rpg/infrastructure/services/legacyRpgPermissionService"

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

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return NextResponse.json({ message: error.message }, { status: error.status })
  }

  return NextResponse.json({ message: fallbackMessage }, { status: 500 })
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
