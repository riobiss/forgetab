import type { CharacterImageCleanupService } from "@/features/world/character/application/ports/CharacterImageCleanupService"
import { imageKitScopedImageService } from "@/features/media/infrastructure/imageKitScopedImageService"

type CharacterImageCleanupParams = {
  rpgOwnerId: string
  characterCreatedByUserId: string | null
  previousImage: string | null
}

export async function cleanupCharacterImageByOwners(
  params: CharacterImageCleanupParams
) {
  const ownerIds = new Set([
    params.rpgOwnerId,
    ...(params.characterCreatedByUserId
      ? [params.characterCreatedByUserId]
      : [])
  ])

  for (const userId of ownerIds) {
    try {
      await imageKitScopedImageService.deleteByUrl({
        userId,
        folder: "characters",
        url: params.previousImage
      })
    } catch {
      // A limpeza da imagem anterior nao deve invalidar a operacao principal.
    }
  }
}

export const imageKitCharacterImageCleanupService: CharacterImageCleanupService =
  {
    async cleanup(params) {
      await cleanupCharacterImageByOwners(params)
    }
  }
