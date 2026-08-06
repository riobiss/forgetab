import type { RpgMapAccessService } from "@/features/world/location/application/ports/RpgMapAccessService"
import type { RpgMapMarkerRepository } from "@/features/world/location/application/ports/RpgMapMarkerRepository"
import { AppError } from "@/features/shared/application/errors/AppError"

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function requiredText(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("Nome do marcador e obrigatorio.", 400)
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

export async function updateRpgMapMarker(
  repository: RpgMapMarkerRepository,
  accessService: RpgMapAccessService,
  params: {
    rpgId: string
    mapId: string
    groupId: string
    markerId: string
    userId: string
    body: unknown
  }
) {
  const access = await accessService.getAccess(params.rpgId, params.userId)
  if (!access.exists) {
    throw new AppError("RPG nao encontrado.", 404)
  }
  if (!access.canManage) {
    throw new AppError("Voce nao pode editar os mapas deste RPG.", 403)
  }

  const body = asRecord(params.body)
  if (!body) {
    throw new AppError("Dados do marcador invalidos.", 400)
  }

  const updated = await repository.updateMarker({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.groupId,
    markerId: params.markerId,
    name: requiredText(body.name),
    location: optionalText(body.location),
    shortDescription: optionalText(body.shortDescription),
    image: optionalText(body.image),
    color: optionalText(body.color)
  })
  if (!updated) {
    throw new AppError("Marcador nao encontrado.", 404)
  }

  return {
    markerId: params.markerId,
    groupId: params.groupId
  }
}
