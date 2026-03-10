import { NextResponse, type NextRequest } from "next/server"
import { getIdentityTemplates, updateIdentityTemplates } from "@/application/rpgConfig/use-cases/rpgConfig"
import { prismaRpgConfigRepository } from "@/infrastructure/rpgConfig/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpgConfig/services/rpgConfigAccessService"
import { getUserIdFromRequest } from "@/presentation/api/rpg-config/requestAuth"
import { toErrorResponse } from "@/presentation/api/rpg-config/toErrorResponse"

type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const payload = await getIdentityTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId,
      userId,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao buscar campos de identidade.")
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const body = (await request.json()) as { fields?: unknown }
    const payload = await updateIdentityTemplates(rpgConfigAccessService, prismaRpgConfigRepository, {
      rpgId,
      userId,
      fields: body.fields,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao salvar campos de identidade.")
  }
}
