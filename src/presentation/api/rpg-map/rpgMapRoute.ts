import { NextRequest, NextResponse } from "next/server"
import { updateRpgMapImage } from "@/application/rpgMap/use-cases/rpgMap"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{ rpgId: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const body = (await request.json()) as { mapImage?: unknown }
    const payload = await updateRpgMapImage(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId,
      userId,
      mapImage: body.mapImage,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar mapa.")
  }
}
