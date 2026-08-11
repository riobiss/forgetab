import type {
  JsonMapValue,
  RpgMapSectionDto,
  RpgMapSectionTreeNodeDto
} from "@forgetab/world-contracts/location"
import {
  upsertRpgMapMarkerGroupSchema,
  upsertRpgMapSchema,
  upsertRpgMapSectionSchema
} from "@forgetab/world-contracts/validation/rpgMap"
import { AppError } from "@/features/shared/application/errors/AppError"

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null
  return value.trim() || null
}

export function normalizeOptionalUrl(value: unknown) {
  return normalizeOptionalText(value)
}

function normalizeObject(value: unknown): JsonMapValue {
  if (!value || Array.isArray(value) || typeof value !== "object") return {}
  return value as JsonMapValue
}

function normalizeObjectOrNull(value: unknown): JsonMapValue | null {
  return value == null ? null : normalizeObject(value)
}

export function ensureCanView(access: {
  exists: boolean
  canManage: boolean
  isAcceptedMember: boolean
}) {
  if (!access.exists || (!access.canManage && !access.isAcceptedMember)) {
    throw new AppError("RPG nao encontrado.", 404)
  }
}

export function ensureCanManage(access: {
  exists: boolean
  canManage: boolean
}) {
  if (!access.exists) throw new AppError("RPG nao encontrado.", 404)
  if (!access.canManage) {
    throw new AppError("Voce nao pode editar os mapas deste RPG.", 403)
  }
}

export function withPermissions<T extends { createdByUserId?: string | null }>(
  access: { canManage: boolean },
  userId: string,
  entity: T
) {
  return {
    ...entity,
    canEdit: access.canManage || entity.createdByUserId === userId,
    canDelete: access.canManage || entity.createdByUserId === userId
  }
}

export function withManagedPermissions<T>(
  access: { canManage: boolean },
  entity: T
) {
  return { ...entity, canEdit: access.canManage, canDelete: access.canManage }
}

export function buildSectionTree(
  sections: RpgMapSectionDto[]
): RpgMapSectionTreeNodeDto[] {
  const nodes = new Map<string, RpgMapSectionTreeNodeDto>()
  const roots: RpgMapSectionTreeNodeDto[] = []
  for (const section of sections) {
    nodes.set(section.id, { ...section, children: [] })
  }
  for (const section of sections) {
    const node = nodes.get(section.id)
    if (!node) continue
    const parent = section.parentSectionId
      ? nodes.get(section.parentSectionId)
      : null
    if (parent) parent.children.push(node)
    else roots.push(node)
  }
  function sortNodes(items: RpgMapSectionTreeNodeDto[]) {
    items.sort(
      (left, right) =>
        left.order - right.order || left.name.localeCompare(right.name)
    )
    items.forEach((item) => sortNodes(item.children))
  }
  sortNodes(roots)
  return roots
}

export function assertCanManageOwnResource(
  access: { exists: boolean; canManage: boolean },
  owner: { createdByUserId: string | null } | null,
  userId: string,
  notFoundMessage: string
) {
  if (!access.exists) throw new AppError("RPG nao encontrado.", 404)
  if (!owner) throw new AppError(notFoundMessage, 404)
  if (access.canManage || owner.createdByUserId === userId) return
  throw new AppError(
    "Voce so pode editar ou remover registros criados por voce.",
    403
  )
}

export function ensureParentIsValid(
  sectionId: string,
  parentSectionId: string | null,
  sections: RpgMapSectionDto[]
) {
  if (!parentSectionId) return
  if (parentSectionId === sectionId) {
    throw new AppError("Uma secao nao pode ser pai dela mesma.", 400)
  }
  const childrenByParent = new Map<string | null, string[]>()
  for (const section of sections) {
    const children = childrenByParent.get(section.parentSectionId) ?? []
    children.push(section.id)
    childrenByParent.set(section.parentSectionId, children)
  }
  const stack = [...(childrenByParent.get(sectionId) ?? [])]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    if (current === parentSectionId) {
      throw new AppError(
        "Nao e possivel mover uma secao para dentro da propria descendencia.",
        400
      )
    }
    stack.push(...(childrenByParent.get(current) ?? []))
  }
}

export function parseMapBody(body: unknown) {
  const parsed = upsertRpgMapSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400
    )
  }
  return {
    title: parsed.data.title.trim(),
    description: normalizeOptionalText(parsed.data.description),
    type: normalizeOptionalText(parsed.data.type),
    image: normalizeOptionalUrl(parsed.data.image)
  }
}

export function parseSectionBody(body: unknown) {
  const parsed = upsertRpgMapSectionSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400
    )
  }
  return {
    name: parsed.data.name.trim(),
    description: normalizeOptionalText(parsed.data.description),
    type: normalizeOptionalText(parsed.data.type),
    parentSectionId: normalizeOptionalText(parsed.data.parentSectionId),
    customFields: normalizeObjectOrNull(parsed.data.customFields)
  }
}

export function parseMarkerGroupBody(body: unknown) {
  const parsed = upsertRpgMapMarkerGroupSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400
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
      pinStyle: normalizeOptionalText(marker.pinStyle)
    }))
  }
}
