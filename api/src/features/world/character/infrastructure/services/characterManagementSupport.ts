import { cleanupCharacterImageByOwners } from "@/features/world/character/infrastructure/services/imageKitCharacterImageCleanupService.js"

export type CharacterPermissionContext = {
  rpgOwnerId: string
  characterCreatedByUserId: string | null
}

export async function cleanupCharacterImage(
  permission: CharacterPermissionContext,
  previousImage: string | null,
  nextImage: string | null,
) {
  if (!previousImage || previousImage === nextImage) {
    return
  }

  await cleanupCharacterImageByOwners({
    ...permission,
    previousImage,
  })
}
