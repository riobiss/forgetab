import type { RpgMapGateway } from "@/application/rpgMap/contracts/RpgMapGateway"
import type { RpgMapAccessService } from "@/application/rpgMap/ports/RpgMapAccessService"
import type { RpgMapRepository } from "@/application/rpgMap/ports/RpgMapRepository"
import type {
  JsonMapValue,
  RpgMapDetailViewDto,
  RpgMapDto,
  UpsertRpgMapMarkerGroupPayloadDto,
  RpgMapSectionDto,
  RpgMapSectionTreeNodeDto,
  RpgMapsViewDto,
} from "@/application/rpgMap/types"
import { reorderRpgMapSectionSchema, upsertRpgMapMarkerGroupSchema, upsertRpgMapSchema, upsertRpgMapSectionSchema } from "@/lib/validators/rpgMap"
import { AppError } from "@/shared/errors/AppError"

function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

function normalizeObject(value: unknown): JsonMapValue {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return {}
  }
  return value as JsonMapValue
}

function normalizeObjectOrNull(value: unknown): JsonMapValue | null {
  if (value == null) {
    return null
  }
  return normalizeObject(value)
}

function ensureCanView(access: { exists: boolean; canManage: boolean; isAcceptedMember: boolean }) {
  if (!access.exists || (!access.canManage && !access.isAcceptedMember)) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

function ensureCanManage(access: { exists: boolean; canManage: boolean }) {
  if (!access.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
  if (!access.canManage) {
    throw new AppError("Voce nao pode editar os mapas deste RPG.", 403)
  }
}

function withPermissions<T extends { createdByUserId?: string | null }>(
  access: { canManage: boolean },
  userId: string,
  entity: T,
) {
  return {
    ...entity,
    canEdit: access.canManage || entity.createdByUserId === userId,
    canDelete: access.canManage || entity.createdByUserId === userId,
  }
}
function buildSectionTree(sections: RpgMapSectionDto[]): RpgMapSectionTreeNodeDto[] {
  const nodes = new Map<string, RpgMapSectionTreeNodeDto>()
  const roots: RpgMapSectionTreeNodeDto[] = []

  for (const section of sections) {
    nodes.set(section.id, { ...section, children: [] })
  }

  for (const section of sections) {
    const node = nodes.get(section.id)
    if (!node) continue

    if (section.parentSectionId) {
      const parent = nodes.get(section.parentSectionId)
      if (parent) {
        parent.children.push(node)
        continue
      }
    }

    roots.push(node)
  }

  const sortNodes = (items: RpgMapSectionTreeNodeDto[]) => {
    items.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))
    for (const item of items) {
      sortNodes(item.children)
    }
  }

  sortNodes(roots)
  return roots
}

function assertCanManageOwnResource(
  access: { exists: boolean; canManage: boolean },
  owner: { createdByUserId: string | null } | null,
  userId: string,
  notFoundMessage: string,
) {
  if (!access.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
  if (!owner) {
    throw new AppError(notFoundMessage, 404)
  }
  if (access.canManage || owner.createdByUserId === userId) {
    return
  }
  throw new AppError("Voce so pode editar ou remover registros criados por voce.", 403)
}

function ensureParentIsValid(sectionId: string, parentSectionId: string | null, sections: RpgMapSectionDto[]) {
  if (!parentSectionId) {
    return
  }
  if (parentSectionId === sectionId) {
    throw new AppError("Uma secao nao pode ser pai dela mesma.", 400)
  }

  const childrenByParent = new Map<string | null, string[]>()
  for (const section of sections) {
    const siblings = childrenByParent.get(section.parentSectionId) ?? []
    siblings.push(section.id)
    childrenByParent.set(section.parentSectionId, siblings)
  }

  const stack = [...(childrenByParent.get(sectionId) ?? [])]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    if (current === parentSectionId) {
      throw new AppError("Nao e possivel mover uma secao para dentro da propria descendencia.", 400)
    }
    stack.push(...(childrenByParent.get(current) ?? []))
  }
}

function parseMapBody(body: unknown) {
  const parsed = upsertRpgMapSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
  }
  return {
    title: parsed.data.title.trim(),
    description: normalizeOptionalText(parsed.data.description),
    type: normalizeOptionalText(parsed.data.type),
    image: normalizeOptionalUrl(parsed.data.image),
  }
}

function parseSectionBody(body: unknown) {
  const parsed = upsertRpgMapSectionSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
  }
  return {
    name: parsed.data.name.trim(),
    description: normalizeOptionalText(parsed.data.description),
    type: normalizeOptionalText(parsed.data.type),
    parentSectionId: normalizeOptionalText(parsed.data.parentSectionId),
    customFields: normalizeObjectOrNull(parsed.data.customFields),
  }
}

function parseMarkerGroupBody(body: unknown) {
  const parsed = upsertRpgMapMarkerGroupSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
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

export async function listRpgMaps(
  repository: RpgMapRepository,
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
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string | null },
): Promise<RpgMapDetailViewDto> {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)

  const map = await repository.findMap(params.rpgId, params.mapId)
  if (!map) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  const sections = await repository.listSections(params.rpgId, params.mapId)
  const markerGroups = await repository.listMarkerGroups(params.rpgId, params.mapId)
  const safeUserId = params.userId ?? ""

  return {
    map: params.userId ? withPermissions(access, safeUserId, map) : map,
    sections: params.userId
      ? sections.map((section) => withPermissions(access, safeUserId, section))
      : sections,
    tree: buildSectionTree(
      params.userId ? sections.map((section) => withPermissions(access, safeUserId, section)) : sections,
    ),
    markerGroups: params.userId
      ? markerGroups.map((group) => ({
          ...withPermissions(access, safeUserId, group),
          markers: group.markers.map((marker) => withPermissions(access, safeUserId, marker)),
        }))
      : markerGroups,
    canManage: access.canManage,
  }
}

export async function createRpgMap(
  repository: RpgMapRepository,
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
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const owner = await repository.findMapOwner({ rpgId: params.rpgId, mapId: params.mapId })
  const current = await repository.findMap(params.rpgId, params.mapId)
  if (!current) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  const input = parseMapBody(params.body)
  const isChangingImage = input.image !== current.image
  if (isChangingImage) {
    assertCanManageOwnResource(access, owner, params.userId, "Mapa nao encontrado.")
  }

  const map = await repository.updateMap({
    rpgId: params.rpgId,
    mapId: params.mapId,
    ...input,
  })
  if (!map) {
    throw new AppError("Mapa nao encontrado.", 404)
  }
  return { map }
}

export async function deleteRpgMap(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  const owner = await repository.findMapOwner({ rpgId: params.rpgId, mapId: params.mapId })
  assertCanManageOwnResource(access, owner, params.userId, "Mapa nao encontrado.")

  const deleted = await repository.deleteMap(params.rpgId, params.mapId)
  if (!deleted) {
    throw new AppError("Mapa nao encontrado.", 404)
  }
  return { message: "Mapa removido com sucesso." }
}

export async function createRpgMapSection(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)

  const map = await repository.findMap(params.rpgId, params.mapId)
  if (!map) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  const input = parseSectionBody(params.body)
  if (input.parentSectionId) {
    const parent = await repository.findSection({
      rpgId: params.rpgId,
      mapId: params.mapId,
      sectionId: input.parentSectionId,
    })
    if (!parent) {
      throw new AppError("Secao pai nao encontrada.", 404)
    }
  }

  const section = await repository.createSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    userId: params.userId,
    ...input,
  })
  return { section }
}

export async function updateRpgMapSection(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; sectionId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)

  const sections = await repository.listSections(params.rpgId, params.mapId)
  const input = parseSectionBody(params.body)
  ensureParentIsValid(params.sectionId, input.parentSectionId, sections)

  if (input.parentSectionId) {
    const parent = sections.find((section) => section.id === input.parentSectionId)
    if (!parent) {
      throw new AppError("Secao pai nao encontrada.", 404)
    }
  }

  const section = await repository.updateSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
    ...input,
  })
  if (!section) {
    throw new AppError("Secao nao encontrada.", 404)
  }
  return { section }
}

export async function deleteRpgMapSection(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; sectionId: string; userId: string },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)

  const deleted = await repository.deleteSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
  })
  if (!deleted) {
    throw new AppError("Secao nao encontrada.", 404)
  }
  return { message: "Secao removida com sucesso." }
}

export async function reorderRpgMapSection(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; sectionId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)

  const parsed = reorderRpgMapSectionSchema.safeParse(params.body)
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
  }

  const current = await repository.findSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
  })
  if (!current) {
    throw new AppError("Secao nao encontrada.", 404)
  }

  const adjacent = await repository.findAdjacentSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
    parentSectionId: current.parentSectionId,
    direction: parsed.data.direction,
  })
  if (!adjacent) {
    return { section: current }
  }

  await repository.swapSectionOrder({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
    otherSectionId: adjacent.id,
  })

  const section = await repository.findSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
  })
  if (!section) {
    throw new AppError("Secao nao encontrada.", 404)
  }
  return { section }
}

export async function updateRpgMapImage(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; mapImage: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  const owner = await repository.findMapOwner({ rpgId: params.rpgId, mapId: params.mapId })
  assertCanManageOwnResource(access, owner, params.userId, "Mapa nao encontrado.")

  const current = await repository.findMap(params.rpgId, params.mapId)
  if (!current) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  const mapImage = normalizeOptionalUrl(params.mapImage)
  const updated = await repository.updateMap({
    rpgId: params.rpgId,
    mapId: params.mapId,
    title: current.title,
    description: current.description,
    type: current.type,
    image: mapImage,
  })
  if (!updated) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  return {
    message: "Mapa atualizado com sucesso.",
    mapImage,
  }
}

export async function createRpgMapMarkerGroup(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)

  const map = await repository.findMap(params.rpgId, params.mapId)
  if (!map) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  const input = parseMarkerGroupBody(params.body)
  const markerGroup = await repository.createMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    userId: params.userId,
    ...input,
  })
  return { markerGroup }
}

export async function updateRpgMapMarkerGroup(
  repository: RpgMapRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; groupId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanManage(access)

  const input = parseMarkerGroupBody(params.body)
  const markerGroup = await repository.updateMarkerGroup({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.groupId,
    ...input,
  })
  if (!markerGroup) {
    throw new AppError("Grupo de marcadores nao encontrado.", 404)
  }

  return { markerGroup }
}

export async function deleteRpgMapMarkerGroup(
  repository: RpgMapRepository,
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

export async function persistRpgMapImageUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; mapImage: string | null },
) {
  return gateway.saveMapImage(params.rpgId, params.mapId, params.mapImage)
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

export async function uploadRpgMapMarkerImageUseCase(
  gateway: RpgMapGateway,
  params: { file: File; oldUrl?: string | null },
) {
  return gateway.uploadMarkerImage(params.file, params.oldUrl)
}

export async function deleteRpgMapMarkerImageByUrlUseCase(
  gateway: RpgMapGateway,
  params: { url: string },
) {
  return gateway.deleteMarkerImage(params.url)
}

export async function loadRpgMapsUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string },
) {
  return gateway.fetchMaps(params.rpgId)
}

export async function loadRpgMapDetailUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string },
) {
  return gateway.fetchMap(params.rpgId, params.mapId)
}

export async function createRpgMapUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; payload: {
    title: string
    description: string | null
    type: string | null
    image: string | null
  } },
) {
  return gateway.createMap(params.rpgId, params.payload)
}

export async function updateRpgMapUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; payload: {
    title: string
    description: string | null
    type: string | null
    image: string | null
  } },
) {
  return gateway.updateMap(params.rpgId, params.mapId, params.payload)
}

export async function deleteRpgMapUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string },
) {
  return gateway.deleteMap(params.rpgId, params.mapId)
}

export async function createRpgMapSectionUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; payload: {
    name: string
    description: string | null
    type: string | null
    parentSectionId: string | null
    customFields: JsonMapValue | null
  } },
) {
  return gateway.createSection(params.rpgId, params.mapId, params.payload)
}

export async function updateRpgMapSectionUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; sectionId: string; payload: {
    name: string
    description: string | null
    type: string | null
    parentSectionId: string | null
    customFields: JsonMapValue | null
  } },
) {
  return gateway.updateSection(params.rpgId, params.mapId, params.sectionId, params.payload)
}

export async function deleteRpgMapSectionUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; sectionId: string },
) {
  return gateway.deleteSection(params.rpgId, params.mapId, params.sectionId)
}

export async function reorderRpgMapSectionUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; sectionId: string; direction: "up" | "down" },
) {
  return gateway.reorderSection(params.rpgId, params.mapId, params.sectionId, params.direction)
}

export async function createRpgMapMarkerGroupUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; payload: UpsertRpgMapMarkerGroupPayloadDto },
) {
  return gateway.createMarkerGroup(params.rpgId, params.mapId, params.payload)
}

export async function updateRpgMapMarkerGroupUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; groupId: string; payload: UpsertRpgMapMarkerGroupPayloadDto },
) {
  return gateway.updateMarkerGroup(params.rpgId, params.mapId, params.groupId, params.payload)
}

export async function deleteRpgMapMarkerGroupUseCase(
  gateway: RpgMapGateway,
  params: { rpgId: string; mapId: string; groupId: string },
) {
  return gateway.deleteMarkerGroup(params.rpgId, params.mapId, params.groupId)
}
