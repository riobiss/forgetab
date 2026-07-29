import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapsRepository } from "@/features/world/location/application/ports/RpgMapsRepository"
import { AppError } from "@/shared/errors/AppError"
import {
  assertCanManageOwnResource,
  normalizeOptionalUrl,
} from "./rpgMapUseCaseSupport"

export async function updateRpgMapImage(
  repository: RpgMapsRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; mapImage: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  const owner = await repository.findMapOwner({
    rpgId: params.rpgId,
    mapId: params.mapId,
  })
  assertCanManageOwnResource(
    access,
    owner,
    params.userId,
    "Mapa nao encontrado.",
  )
  const current = await repository.findMap(params.rpgId, params.mapId)
  if (!current) throw new AppError("Mapa nao encontrado.", 404)

  const mapImage = normalizeOptionalUrl(params.mapImage)
  const updated = await repository.updateMap({
    rpgId: params.rpgId,
    mapId: params.mapId,
    title: current.title,
    description: current.description,
    type: current.type,
    image: mapImage,
  })
  if (!updated) throw new AppError("Mapa nao encontrado.", 404)
  return { message: "Mapa atualizado com sucesso.", mapImage }
}
