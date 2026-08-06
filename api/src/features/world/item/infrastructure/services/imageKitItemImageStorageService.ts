import type { ItemImageStorageService } from "@/features/world/item/application/ports/ItemImageStorageService"
import { imageKitScopedImageService } from "@/features/media/infrastructure/imageKitScopedImageService"

export const imageKitItemImageStorageService: ItemImageStorageService = {
  async deleteItemImageByUrl(userId, imageUrl) {
    try {
      await imageKitScopedImageService.deleteByUrl({
        userId,
        folder: "items",
        url: imageUrl
      })
    } catch {
      // Fluxo legado de update/delete de item nao deve falhar por ausencia de configuracao de media.
    }
  }
}
