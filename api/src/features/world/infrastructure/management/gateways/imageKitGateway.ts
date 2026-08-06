import type { ImageGateway } from "@/features/world/application/management/ports/ImageGateway"
import { imageKitScopedImageService } from "@/features/media/infrastructure/imageKitScopedImageService"

export const imageKitGateway: ImageGateway = {
  async deleteRpgImageByUrl({ ownerId, imageUrl }) {
    if (
      !process.env.IMAGEKIT_PRIVATE_KEY ||
      !process.env.IMAGEKIT_URL_ENDPOINT
    ) {
      return
    }

    await imageKitScopedImageService.deleteByUrl({
      userId: ownerId,
      folder: "rpgs",
      url: imageUrl
    })
  }
}
