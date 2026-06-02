import type { RpgProfileAccessService } from "@/application/profile/ports/RpgProfileAccessService"
import type { RpgUserProfileWriter } from "@/application/profile/ports/RpgUserProfileWriter"
import { AppError } from "@/shared/errors/AppError"

export type UpdateRpgProfileInput = {
  userId: string
  rpgId: string
  displayName?: string | null
}

export async function updateRpgProfileUseCase(
  deps: {
    accessService: RpgProfileAccessService
    writer: RpgUserProfileWriter
  },
  input: UpdateRpgProfileInput,
) {
  const displayName =
    typeof input.displayName === "string" ? input.displayName.trim() : null

  if (displayName !== null && displayName.length > 40) {
    return { status: "invalid" as const, message: "Apelido deve ter ate 40 caracteres." }
  }

  const canEdit = await deps.accessService.canEditRpgProfile(input.rpgId, input.userId)

  if (!canEdit) {
    throw new AppError("RPG nao encontrado para este usuario.", 404)
  }

  const data = await deps.writer.updateRpgDisplayName(input.userId, input.rpgId, displayName || null)

  return {
    status: "ok" as const,
    data,
  }
}
