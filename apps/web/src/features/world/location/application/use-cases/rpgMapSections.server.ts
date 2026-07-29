import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapSectionsRepository } from "@/features/world/location/application/ports/RpgMapSectionsRepository"
import type { RpgMapsRepository } from "@/features/world/location/application/ports/RpgMapsRepository"
import type { UpsertRpgMapSectionPayloadDto } from "@/features/world/location/application/types"
import {
  reorderRpgMapSectionSchema,
  upsertRpgMapSectionSchema,
} from "@/lib/validators/rpgMap"
import { AppError } from "@/shared/errors/AppError"
import {
  ensureCanView,
  ensureParentIsValid,
  normalizeObjectOrNull,
  normalizeOptionalText,
} from "./rpgMapUseCaseSupport"

type RpgMapSectionCreationRepository = RpgMapsRepository &
  RpgMapSectionsRepository

function parseSectionBody(body: unknown): UpsertRpgMapSectionPayloadDto {
  const parsed = upsertRpgMapSectionSchema.safeParse(body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400,
    )
  }
  return {
    name: parsed.data.name.trim(),
    description: normalizeOptionalText(parsed.data.description),
    type: normalizeOptionalText(parsed.data.type),
    parentSectionId: normalizeOptionalText(parsed.data.parentSectionId),
    customFields: normalizeObjectOrNull(parsed.data.customFields),
  }
}

export async function createRpgMapSection(
  repository: RpgMapSectionCreationRepository,
  accessService: RpgMapAccessService,
  params: { rpgId: string; mapId: string; userId: string; body: unknown },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  if (!(await repository.findMap(params.rpgId, params.mapId))) {
    throw new AppError("Mapa nao encontrado.", 404)
  }

  const input = parseSectionBody(params.body)
  if (
    input.parentSectionId &&
    !(await repository.findSection({
      rpgId: params.rpgId,
      mapId: params.mapId,
      sectionId: input.parentSectionId,
    }))
  ) {
    throw new AppError("Secao pai nao encontrada.", 404)
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
  repository: RpgMapSectionsRepository,
  accessService: RpgMapAccessService,
  params: {
    rpgId: string
    mapId: string
    sectionId: string
    userId: string
    body: unknown
  },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const sections = await repository.listSections(params.rpgId, params.mapId)
  const input = parseSectionBody(params.body)
  ensureParentIsValid(params.sectionId, input.parentSectionId, sections)
  if (
    input.parentSectionId &&
    !sections.some((section) => section.id === input.parentSectionId)
  ) {
    throw new AppError("Secao pai nao encontrada.", 404)
  }

  const section = await repository.updateSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
    ...input,
  })
  if (!section) throw new AppError("Secao nao encontrada.", 404)
  return { section }
}

export async function deleteRpgMapSection(
  repository: RpgMapSectionsRepository,
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
  if (!deleted) throw new AppError("Secao nao encontrada.", 404)
  return { message: "Secao removida com sucesso." }
}

export async function reorderRpgMapSection(
  repository: RpgMapSectionsRepository,
  accessService: RpgMapAccessService,
  params: {
    rpgId: string
    mapId: string
    sectionId: string
    userId: string
    body: unknown
  },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  ensureCanView(access)
  const parsed = reorderRpgMapSectionSchema.safeParse(params.body)
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Dados invalidos.",
      400,
    )
  }
  const current = await repository.findSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
  })
  if (!current) throw new AppError("Secao nao encontrada.", 404)

  const adjacent = await repository.findAdjacentSection({
    rpgId: params.rpgId,
    mapId: params.mapId,
    sectionId: params.sectionId,
    parentSectionId: current.parentSectionId,
    direction: parsed.data.direction,
  })
  if (!adjacent) return { section: current }

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
  if (!section) throw new AppError("Secao nao encontrada.", 404)
  return { section }
}
