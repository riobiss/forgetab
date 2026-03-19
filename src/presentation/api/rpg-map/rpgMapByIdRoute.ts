import { NextResponse, type NextRequest } from "next/server"
import { deleteRpgMap, getRpgMapDetail, updateRpgMap } from "@/application/rpgMap/use-cases/rpgMap"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"

type RouteContext = {
  params: Promise<{ rpgId: string; mapId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, mapId } = await context.params
    const payload = await getRpgMapDetail(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId,
      mapId,
      userId,
    })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao carregar mapa.")
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, mapId } = await context.params
    const body = await request.json()
    const payload = await updateRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId,
      mapId,
      userId,
      body,
    })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar mapa.")
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId, mapId } = await context.params
    const payload = await deleteRpgMap(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId,
      mapId,
      userId,
    })
    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao remover mapa.")
  }
}
