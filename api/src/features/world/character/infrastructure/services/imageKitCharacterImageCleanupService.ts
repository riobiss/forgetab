import type { CharacterImageCleanupService } from "@/features/world/character/application/ports/CharacterImageCleanupService"
import {
  buildCharacterFolder,
  deleteCharacterImageKitFileByUrl,
  getCharacterImageKitConfig,
} from "@/features/world/character/infrastructure/services/characterImageCleanupService"

export const imageKitCharacterImageCleanupService: CharacterImageCleanupService =
  {
    async cleanup(params) {
      const config = getCharacterImageKitConfig()
      if (!config.ok) {
        return
      }

      const allowedFolderPaths = [
        buildCharacterFolder(params.rpgOwnerId),
        ...(params.characterCreatedByUserId
          ? [buildCharacterFolder(params.characterCreatedByUserId)]
          : []),
      ]

      try {
        await deleteCharacterImageKitFileByUrl(
          config.privateKey,
          config.urlEndpoint,
          params.previousImage,
          allowedFolderPaths,
        )
      } catch {
        // A limpeza da imagem anterior nao deve invalidar a atualizacao.
      }
    },
  }
