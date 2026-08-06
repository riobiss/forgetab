import type {
  JsonMapValue,
  RpgMapSectionDto,
  RpgMapSectionTreeNodeDto
} from "@forgetab/world-contracts/location"
import { AppError } from "@/shared/errors/AppError"

export function normalizeOptionalUrl(value: unknown) {
  if (typeof value !== "string") return null
  return value.trim() || null
}

export function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") return null
  return value.trim() || null
}

export function normalizeObjectOrNull(value: unknown): JsonMapValue | null {
  if (value == null) return null
  if (Array.isArray(value) || typeof value !== "object") return {}
  return value as JsonMapValue
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
  if (!access.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
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
  return {
    ...entity,
    canEdit: access.canManage,
    canDelete: access.canManage
  }
}

export function assertCanManageOwnResource(
  access: { exists: boolean; canManage: boolean },
  owner: { createdByUserId: string | null } | null,
  userId: string,
  notFoundMessage: string
) {
  if (!access.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
  if (!owner) {
    throw new AppError(notFoundMessage, 404)
  }
  if (access.canManage || owner.createdByUserId === userId) return

  throw new AppError(
    "Voce so pode editar ou remover registros criados por voce.",
    403
  )
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

    if (section.parentSectionId) {
      const parent = nodes.get(section.parentSectionId)
      if (parent) {
        parent.children.push(node)
        continue
      }
    }
    roots.push(node)
  }

  function sortNodes(items: RpgMapSectionTreeNodeDto[]) {
    items.sort(
      (left, right) =>
        left.order - right.order || left.name.localeCompare(right.name)
    )
    for (const item of items) sortNodes(item.children)
  }

  sortNodes(roots)
  return roots
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
    const siblings = childrenByParent.get(section.parentSectionId) ?? []
    siblings.push(section.id)
    childrenByParent.set(section.parentSectionId, siblings)
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
