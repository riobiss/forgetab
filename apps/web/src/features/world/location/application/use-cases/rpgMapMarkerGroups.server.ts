import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapMarkerGroupsRepository } from "@/features/world/location/application/ports/RpgMapMarkerGroupsRepository"
import type { RpgMapsRepository } from "@/features/world/location/application/ports/RpgMapsRepository"
import type { UpsertRpgMapMarkerGroupPayloadDto } from "@/features/world/location/application/types"
import { upsertRpgMapMarkerGroupSchema } from "@/lib/validators/rpgMap"
import { AppError } from "@/shared/errors/AppError"
import {
  ensureCanManage,
  normalizeOptionalText,
  normalizeOptionalUrl,
  withManagedPermissions,
} from "./rpgMapUseCaseSupport"

type RpgMapMarkerGroupCreationRepository = RpgMapsRepository &
  RpgMapMarkerGroupsRepository

function parseMarkerGroupBody(
  body: unknown,
): UpsertRpgMapMarkerGroupPayloadDto {
  const parsed = upsertRpgMapMarkerGroupSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400,
    )
  }
  return {
    name: parsed.data.name.trim(),
    color: parsed.data.color.trim(),
    markers: parsed.data.markers.map((marker) => ({
      id: normalizeOptionalText(marker.id) ?? undefined,
      name: marker.name.trim(),
      location: normalizeOptionalText(marker.location),
      shortDescription: normalizeOptionalText(marker.shortDescription),
      image: normalizeOptionalUrl(marker.image),
      color: normalizeOptionalText(marker.color),
      x: marker.x,
      y: marker.y,
      size: marker.size ?? null,
      pinStyle: normalizeOptionalText(marker.pinStyle),
    })),
  }
}

function presentMarkerGroup(
  access: { canManage: boolean },
  markerGroup: Awaited<
    ReturnType<RpgMapMarkerGroupsRepository["createMarkerGroup"]>
  >,
) {
  return {
    ...withManagedPermissions(access, markerGroup),
    markers: markerGroup.markers.map((marker) =>
      withManagedPermissions(access, marker),
    ),
  }
}

export async function createRpgMapMarkerGroup(
  repository: RpgMapMarkerGroupCreationRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  if (!(await repository.findMap(params.rpgId, params.mapId))) {
    throw new AppError("Mapa nao encontrado.", 404)
  }
  const markerGroup = await repository.createMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    userId: params.userId,
    ...parseMarkerGroupBody(params.body),
  })
  return { markerGroup: presentMarkerGroup(access, markerGroup) }
}

export async function updateRpgMapMarkerGroup(
  repository: RpgMapMarkerGroupsRepository,
  accessService: RpgMapAccessService,
  params: {
    rpgId: string
    mapId: string
    groupId: string
    userId: string
    body: unknown
  },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  const markerGroup = await repository.updateMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.groupId,
    ...parseMarkerGroupBody(params.body),
  })
  if (!markerGroup) {
    throw new AppError("Grupo de marcadores nao encontrado.", 404)
  }
  return { markerGroup: presentMarkerGroup(access, markerGroup) }
}

export async function deleteRpgMapMarkerGroup(
  repository: RpgMapMarkerGroupsRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; groupId: string; userId: string },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)
  const deleted = await repository.deleteMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.groupId,
  })
  if (!deleted) {
    throw new AppError("Grupo de marcadores nao encontrado.", 404)
  }
  return { message: "Grupo de marcadores removido com sucesso." }
}
