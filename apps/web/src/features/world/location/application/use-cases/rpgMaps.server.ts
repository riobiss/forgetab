import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapMarkerGroupsRepository } from "@/features/world/location/application/ports/RpgMapMarkerGroupsRepository"
import type { RpgMapSectionsRepository } from "@/features/world/location/application/ports/RpgMapSectionsRepository"
import type { RpgMapsRepository } from "@/features/world/location/application/ports/RpgMapsRepository"
import type {
  RpgMapDetailViewDto,
  RpgMapsViewDto,
  UpsertRpgMapPayloadDto,
} from "@/features/world/location/application/types"
import { upsertRpgMapSchema } from "@/lib/validators/rpgMap"
import { AppError } from "@/shared/errors/AppError"
import {
  assertCanManageOwnResource,
  buildSectionTree,
  ensureCanManage,
  ensureCanView,
  normalizeOptionalText,
  normalizeOptionalUrl,
  withManagedPermissions,
  withPermissions,
} from "./rpgMapUseCaseSupport"

type RpgMapDetailRepository = RpgMapsRepository &
  RpgMapSectionsRepository &
  RpgMapMarkerGroupsRepository

function parseMapBody(body: unknown): UpsertRpgMapPayloadDto {
  const parsed = upsertRpgMapSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400,
    )
  }
  return {
    title: parsed.data.title.trim(),
    description: normalizeOptionalText(parsed.data.description),
    type: normalizeOptionalText(parsed.data.type),
    image: normalizeOptionalUrl(parsed.data.image),
  }
}

export async function listRpgMaps(
  repository: RpgMapsRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; userId: string | null },
): Promise<RpgMapsViewDto> {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const maps = await repository.listMaps(params.rpgId)
  return {
    maps: params.userId
      ? maps.map((map) => withPermissions(access, params.userId ?? "", map))
      : maps,
    canManage: access.canManage,
  }
}

export async function getRpgMapDetail(
  repository: RpgMapDetailRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string | null },
): Promise<RpgMapDetailViewDto> {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const map = await repository.findMap(params.rpgId, params.mapId)
  if (!map) throw new AppError("Mapa nao encontrado.", 404)

  const sections = await repository.listSections(params.rpgId, params.mapId)
  const markerGroups = await repository.listMarkerGroups(
    params.rpgId,
    params.mapId,
  )
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
            withManagedPermissions(access, marker),
          ),
        }))
      : markerGroups,
    canManage: access.canManage,
  }
}

export async function createRpgMap(
  repository: RpgMapsRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  const map = await repository.createMap({
    rpgId: params.rpgId,
    userId: params.userId,
    ...parseMapBody(params.body),
  })
  return { map }
}

export async function updateRpgMap(
  repository: RpgMapsRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const owner = await repository.findMapOwner({
    rpgId: params.rpgId,
    mapId: params.mapId,
  })
  const current = await repository.findMap(params.rpgId, params.mapId)
  if (!current) throw new AppError("Mapa nao encontrado.", 404)

  const input = parseMapBody(params.body)
  if (input.image !== current.image) {
    assertCanManageOwnResource(
      access,
      owner,
      params.userId,
      "Mapa nao encontrado.",
    )
  }
  const map = await repository.updateMap({
    rpgId: params.rpgId,
    mapId: params.mapId,
    ...input,
  })
  if (!map) throw new AppError("Mapa nao encontrado.", 404)
  return { map }
}

export async function deleteRpgMap(
  repository: RpgMapsRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string },
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
  if (!(await repository.deleteMap(params.rpgId, params.mapId))) {
    throw new AppError("Mapa nao encontrado.", 404)
  }
  return { message: "Mapa removido com sucesso." }
}
