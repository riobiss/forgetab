import type { RpgProfileAccessService } from "@/features/profile/application//ports/RpgProfileAccessService"
import type { RpgUserProfileWriter } from "@/features/profile/application//ports/RpgUserProfileWriter"
import { AppError } from "@/features/shared/infrastructure/errors/AppError"

export type UpdateRpgProfileInput = {
  userId: string
  rpgId: string
  displayName?: string | null
  profileImageUrl?: string | null
}

export async function updateRpgProfileUseCase(
  deps: {
    accessService: RpgProfileAccessService
    writer: RpgUserProfileWriter
  },
  input: UpdateRpgProfileInput,
) {
  const displayName =
    typeof input.displayName === "string"
      ? input.displayName.trim()
      : input.displayName === null
        ? null
        : undefined
  const profileImageUrl =
    typeof input.profileImageUrl === "string"
      ? input.profileImageUrl.trim()
      : input.profileImageUrl === null
        ? null
        : undefined

  if (
    displayName !== undefined &&
    displayName !== null &&
    displayName.length > 40
  ) {
    return {
      status: "invalid" as const,
      message: "Apelido deve ter ate 40 caracteres.",
    }
  }

  if (profileImageUrl !== undefined && profileImageUrl !== null) {
    try {
      new URL(profileImageUrl)
    } catch {
      return {
        status: "invalid" as const,
        message: "Imagem deve ser uma URL valida.",
      }
    }
  }

  const canEdit = await deps.accessService.canEditRpgProfile(
    input.rpgId,
    input.userId,
  )

  if (!canEdit) {
    throw new AppError("RPG nao encontrado para este usuario.", 404)
  }

  const data = await deps.writer.updateRpgProfile(input.userId, input.rpgId, {
    ...(displayName !== undefined ? { displayName: displayName || null } : {}),
    ...(profileImageUrl !== undefined
      ? { profileImageUrl: profileImageUrl || null }
      : {}),
  })

  return {
    status: "ok" as const,
    data,
  }
}
