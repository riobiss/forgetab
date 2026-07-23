import { prismaRpgCatalogRepository } from "@/features/world/infrastructure/catalog/repositories/prismaRpgCatalogRepository"
import { prismaRpgDashboardRepository } from "@/features/world/infrastructure/dashboard/repositories/prismaRpgDashboardRepository"
import { rpgDashboardAccessService } from "@/features/world/infrastructure/dashboard/services/rpgDashboardAccessService"
import { imageKitGateway } from "@/features/world/infrastructure/management/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/features/world/infrastructure/management/repositories/prismaRpgRepository"
import { rpgPermissionService } from "@/features/world/infrastructure/management/services/rpgPermissionService"

export const rpgRouteDeps = {
  catalogRepository: prismaRpgCatalogRepository,
  dashboardRepository: prismaRpgDashboardRepository,
  dashboardAccessService: rpgDashboardAccessService,
  repository: prismaRpgRepository,
  permissionService: rpgPermissionService,
  imageGateway: imageKitGateway,
} as const
