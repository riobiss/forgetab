import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapRepository } from "@/features/world/location/application/ports/RpgMapRepository"
import type {
  RpgMapDetailViewDto,
  RpgMapsViewDto
} from "@forgetab/world-contracts/location"
import { AppError } from "@/features/shared/application/errors/AppError"
import {
  assertCanManageOwnResource,
  buildSectionTree,
  ensureCanManage,
  ensureCanView,
  normalizeOptionalUrl,
  parseMapBody,
  withManagedPermissions,
  withPermissions
} from "./rpgMapSupport"

export async function listRpgMaps(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; userId: string | null }
): Promise<RpgMapsViewDto> {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const maps = await repository.listMaps(params.rpgId)
  return {
    maps: params.userId
      ? maps.map((map) => withPermissions(access, params.userId ?? "", map))
      : maps,
    canManage: access.canManage
  }
}

export async function getRpgMapDetail(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string | null }
): Promise<RpgMapDetailViewDto> {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const map = await repository.findMap(params.rpgId, params.mapId)
  if (!map) throw new AppError("Mapa nao encontrado.", 404)

  const [sections, markerGroups] = await Promise.all([
    repository.listSections(params.rpgId, params.mapId),
    repository.listMarkerGroups(params.rpgId, params.mapId)
  ])
  const safeUserId = params.userId ?? ""
  const visibleSections = params.userId
    ? sections.map((section) => withPermissions(access, safeUserId, section))
    : sections

  return {
    map: params.userId ? withPermissions(access, safeUserId, map) : map,
    sections: visibleSections,
    tree: buildSectionTree(visibleSections),
    markerGroups: params.userId
      ? markerGroups.map((group) => ({
          ...withManagedPermissions(access, group),
          markers: group.markers.map((marker) =>
            withManagedPermissions(access, marker)
          )
        }))
      : markerGroups,
    canManage: access.canManage
  }
}

export async function createRpgMap(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; userId: string; body: unknown }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  return {
    map: await repository.createMap({
      rpgId: params.rpgId,
      userId: params.userId,
      ...parseMapBody(params.body)
    })
  }
}

export async function updateRpgMap(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const [owner, current] = await Promise.all([
    repository.findMapOwner({ rpgId: params.rpgId, mapId: params.mapId }),
    repository.findMap(params.rpgId, params.mapId)
  ])
  if (!current) throw new AppError("Mapa nao encontrado.", 404)
  const input = parseMapBody(params.body)
  if (input.image !== current.image) {
    assertCanManageOwnResource(
      access,
      owner,
      params.userId,
      "Mapa nao encontrado."
    )
  }
  const map = await repository.updateMap({
    rpgId: params.rpgId,
    mapId: params.mapId,
    ...input
  })
  if (!map) throw new AppError("Mapa nao encontrado.", 404)
  return { map }
}

export async function deleteRpgMap(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  const owner = await repository.findMapOwner({
    rpgId: params.rpgId,
    mapId: params.mapId
  })
  assertCanManageOwnResource(
    access,
    owner,
    params.userId,
    "Mapa nao encontrado."
  )
  if (!(await repository.deleteMap(params.rpgId, params.mapId))) {
    throw new AppError("Mapa nao encontrado.", 404)
  }
  return { message: "Mapa removido com sucesso." }
}

export async function updateRpgMapImage(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; mapImage: unknown }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  const owner = await repository.findMapOwner({
    rpgId: params.rpgId,
    mapId: params.mapId
  })
  assertCanManageOwnResource(
    access,
    owner,
    params.userId,
    "Mapa nao encontrado."
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
    image: mapImage
  })
  if (!updated) throw new AppError("Mapa nao encontrado.", 404)
  return { message: "Mapa atualizado com sucesso.", mapImage }
}
