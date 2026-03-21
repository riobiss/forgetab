import { NextRequest, NextResponse } from "next/server"
import { getRpgMapDetail, updateRpgMapImage } from "@/application/rpgMap/use-cases/rpgMap"
import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"
import { getUserIdFromRequest } from "@/presentation/api/characters/requestAuth"
import { toErrorResponse } from "@/presentation/api/characters/toErrorResponse"
import { AppError } from "@/shared/errors/AppError"

type RouteContext = {
  params: Promise<{ rpgId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
    }

    const { rpgId } = await context.params
    const mapId = request.nextUrl.searchParams.get("mapId")?.trim()

    if (!mapId) {
      throw new AppError("Mapa nao informado.", 400)
    }

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

    const { rpgId } = await context.params
    const body = (await request.json()) as { mapId?: unknown; mapImage?: unknown }
    const mapId =
      typeof body.mapId === "string" && body.mapId.trim()
        ? body.mapId.trim()
        : (await prismaRpgMapRepository.listMaps(rpgId))[0]?.id

    if (!mapId) {
      throw new AppError("Nenhum mapa encontrado para atualizar a imagem.", 404)
    }

    const payload = await updateRpgMapImage(prismaRpgMapRepository, rpgMapAccessService, {
      rpgId,
      mapId,
      userId,
      mapImage: body.mapImage,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    return toErrorResponse(error, "Erro interno ao atualizar mapa.")
  }
}
