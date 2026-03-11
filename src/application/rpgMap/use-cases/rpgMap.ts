import type { RpgMapGateway } from "@/application/rpgMap/contracts/RpgMapGateway"
import type { RpgMapAccessService } from "@/application/rpgMap/ports/RpgMapAccessService"
import type { RpgMapRepository } from "@/application/rpgMap/ports/RpgMapRepository"
import type { RpgMapViewDto } from "@/application/rpgMap/types"
import { AppError } from "@/shared/errors/AppError"

function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

export async function loadRpgMapView(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; userId: string | null },
): Promise<RpgMapViewDto> {
  const map = await repository.findMapByRpgId(params.rpgId)
  if (!map) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  const access = await accessService.getAccess(params.rpgId, params.userId)
  if (map.visibility === "private" && !access.canManage && !access.isAcceptedMember) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  if (!map.useMundiMap) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  return {
    rpgId: params.rpgId,
    isOwner: access.canManage,
    initialMapSrc: map.mapImage,
  }
}

export async function updateRpgMapImage(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; userId: string; mapImage: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  if (!access.canManage) {
    const map = await repository.findMapByRpgId(params.rpgId)
    if (!map) {
      throw new AppError("RPG nao encontrado.", 404)
    }
    throw new AppError("Voce nao pode editar o mapa deste RPG.", 403)
  }

  const mapImage = normalizeOptionalUrl(params.mapImage)
  const updated = await repository.updateMapImage(params.rpgId, mapImage)
  if (!updated) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  return {
    message: "Mapa atualizado com sucesso.",
    mapImage,
  }
}

export async function persistRpgMapImageUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapImage: string | null },
) {
  return gateway.saveMapImage(params.rpgId, params.mapImage)
}

export async function uploadRpgMapImageUseCase(
  gateway: RpgMapGateway,
  params: { file: File; oldUrl?: string | null },
) {
  return gateway.uploadMapImage(params.file, params.oldUrl)
}

export async function deleteRpgMapImageByUrlUseCase(
  gateway: RpgMapGateway,
  params: { url: string },
) {
  return gateway.deleteMapImage(params.url)
}
