import { prismaRpgCatalogRepository } from "@/infrastructure/rpg/catalog/repositories/prismaRpgCatalogRepository"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpg/dashboard/repositories/prismaRpgDashboardRepository"
import { rpgDashboardAccessService } from "@/infrastructure/rpg/dashboard/services/rpgDashboardAccessService"
import { imageKitGateway } from "@/infrastructure/rpg/management/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/infrastructure/rpg/management/repositories/prismaRpgRepository"
import { rpgPermissionService } from "@/infrastructure/rpg/management/services/rpgPermissionService"

export const rpgRouteDeps = {
  catalogRepository: prismaRpgCatalogRepository,
  dashboardRepository: prismaRpgDashboardRepository,
  dashboardAccessService: rpgDashboardAccessService,
  repository: prismaRpgRepository,
  permissionService: rpgPermissionService,
  imageGateway: imageKitGateway,
} as const
