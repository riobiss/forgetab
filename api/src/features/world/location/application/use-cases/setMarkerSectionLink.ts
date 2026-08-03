import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type {
  MarkerSectionLinkMarker,
  MarkerSectionLinkRepository,
} from "@/features/world/location/application/ports/MarkerSectionLinkRepository"
import { AppError } from "@/features/shared/application/errors/AppError"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function requiredText(value: unknown, message: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(message, 400)
  }
  return value.trim()
}

function optionalText(value: unknown) {
  if (value == null) return null
  if (typeof value !== "string") {
    throw new AppError("Dados do marcador invalidos.", 400)
  }
  return value.trim() || null
}

function parseBody(body: unknown): {
  sectionId: string | null
  marker: MarkerSectionLinkMarker
} {
  const input = asRecord(body)
  const markerInput = asRecord(input?.marker)
  if (!input || !markerInput) {
    throw new AppError("Dados do vinculo invalidos.", 400)
  }

  const sectionId =
    input.sectionId == null
      ? null
      : requiredText(input.sectionId, "Secao invalida.")
  const visibility = markerInput.visibility
  if (visibility !== "private" && visibility !== "public") {
    throw new AppError("Visibilidade do marcador invalida.", 400)
  }

  return {
    sectionId,
    marker: {
      id: requiredText(markerInput.id, "Marcador invalido."),
      groupId: requiredText(markerInput.groupId, "Grupo do marcador invalido."),
      visibility,
      name: requiredText(markerInput.name, "Nome do marcador invalido."),
      location: optionalText(markerInput.location),
      shortDescription: optionalText(markerInput.shortDescription),
      image: optionalText(markerInput.image),
      color: optionalText(markerInput.color),
    },
  }
}

export async function setMarkerSectionLink(
  repository: MarkerSectionLinkRepository,
  accessService: RpgMapAccessService,
  params: {
    rpgId: string
    mapId: string
    userId: string
    body: unknown
  },
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  if (!access.exists || (!access.canManage && !access.isAcceptedMember)) {
    throw new AppError("RPG nao encontrado.", 404)
  }

  const input = parseBody(params.body)
  const result = await repository.setLink({
    rpgId: params.rpgId,
    mapId: params.mapId,
    ...input,
  })

  if (result.status === "marker_not_found") {
    throw new AppError("Marcador nao encontrado.", 404)
  }
  if (result.status === "section_not_found") {
    throw new AppError("Secao nao encontrada.", 404)
  }

  return {
    markerId: input.marker.id,
    sectionId: result.sectionId,
  }
}
