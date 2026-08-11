import { prismaItemRepository } from "@/features/world/item/infrastructure/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/features/world/item/infrastructure/services/imageKitItemImageStorageService"
import { rpgManagementPermissionService } from "@/features/world/infrastructure/services/rpgManagementPermissionService"

export const itemRouteDeps = {
  repository: prismaItemRepository,
  permissionService: rpgManagementPermissionService,
  imageStorageService: imageKitItemImageStorageService
} as const
