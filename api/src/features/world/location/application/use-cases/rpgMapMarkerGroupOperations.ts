import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapRepository } from "@/features/world/location/application/ports/RpgMapRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import {
  ensureCanManage,
  parseMarkerGroupBody,
  withManagedPermissions
} from "./rpgMapSupport"

function withMarkerGroupPermissions<T extends { markers: unknown[] }>(
  access: { canManage: boolean },
  group: T
) {
  return {
    ...withManagedPermissions(access, group),
    markers: group.markers.map((marker) =>
      withManagedPermissions(access, marker)
    )
  }
}

export async function createRpgMapMarkerGroup(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  const map = await repository.findMap(params.rpgId, params.mapId)
  if (!map) throw new AppError("Mapa nao encontrado.", 404)
  const markerGroup = await repository.createMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    userId: params.userId,
    ...parseMarkerGroupBody(params.body)
  })
  return { markerGroup: withMarkerGroupPermissions(access, markerGroup) }
}

export async function updateRpgMapMarkerGroup(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: {
    rpgId: string
    mapId: string
    groupId: string
    userId: string
    body: unknown
  }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  const markerGroup = await repository.updateMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.groupId,
    ...parseMarkerGroupBody(params.body)
  })
  if (!markerGroup) {
    throw new AppError("Grupo de marcadores nao encontrado.", 404)
  }
  return { markerGroup: withMarkerGroupPermissions(access, markerGroup) }
}

export async function deleteRpgMapMarkerGroup(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; groupId: string; userId: string }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  const deleted = await repository.deleteMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.groupId
  })
  if (!deleted) {
    throw new AppError("Grupo de marcadores nao encontrado.", 404)
  }
  return { message: "Grupo de marcadores removido com sucesso." }
}
