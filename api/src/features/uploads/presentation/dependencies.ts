import { imageKitScopedImageService } from "@/features/media/infrastructure/imageKitScopedImageService"

export const scopedImageHandlerDependencies = {
  service: imageKitScopedImageService
} as const
