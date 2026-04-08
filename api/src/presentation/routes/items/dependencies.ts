import { prismaItemRepository } from "@/infrastructure/items/repositories/prismaItemRepository"
import { imageKitItemImageStorageService } from "@/infrastructure/items/services/imageKitItemImageStorageService"
import { rpgPermissionService } from "@/infrastructure/items/services/rpgPermissionService"

export const itemRouteDeps = {
  repository: prismaItemRepository,
  permissionService: rpgPermissionService,
  imageStorageService: imageKitItemImageStorageService,
} as const
