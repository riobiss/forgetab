import {
  buildCharacterFolder,
  deleteCharacterImageKitFileByUrl,
  getCharacterImageKitConfig,
} from "@/features/world/character/infrastructure/services/characterImageCleanupService.js"

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

  const imageKitConfig = getCharacterImageKitConfig()
  if (!imageKitConfig.ok) {
    return
  }

  const allowedFolderPaths = [
    buildCharacterFolder(permission.rpgOwnerId),
    ...(permission.characterCreatedByUserId
      ? [buildCharacterFolder(permission.characterCreatedByUserId)]
      : []),
  ]

  try {
    await deleteCharacterImageKitFileByUrl(
      imageKitConfig.privateKey,
      imageKitConfig.urlEndpoint,
      previousImage,
      allowedFolderPaths,
    )
  } catch {
    // Nao bloqueia a operacao caso a limpeza da imagem falhe.
  }
}
