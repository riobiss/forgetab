import { prismaItemRepository } from "@/features/world/item/infrastructure/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/features/world/item/infrastructure/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/features/world/item/infrastructure/services/rpgPermissionService"

export const itemRouteDeps = {
  repository: prismaItemRepository,
  permissionService: rpgPermissionService,
  imageStorageService: imageKitItemImageStorageService
} as const
