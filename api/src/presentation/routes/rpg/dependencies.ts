import { prismaRpgCatalogRepository } from "@/infrastructure/rpgCatalog/repositories/prismaRpgCatalogRepository"
import { prismaRpgDashboardRepository } from "@/infrastructure/rpgDashboard/repositories/prismaRpgDashboardRepository"
import { rpgDashboardAccessService } from "@/infrastructure/rpgDashboard/services/rpgDashboardAccessService"
import { imageKitGateway } from "@/infrastructure/rpgManagement/gateways/imageKitGateway"
import { prismaRpgRepository } from "@/infrastructure/rpgManagement/repositories/prismaRpgRepository"
import { legacyRpgPermissionService } from "@/infrastructure/rpgManagement/services/legacyRpgPermissionService"

export const rpgRouteDeps = {
  catalogRepository: prismaRpgCatalogRepository,
  dashboardRepository: prismaRpgDashboardRepository,
  dashboardAccessService: rpgDashboardAccessService,
  repository: prismaRpgRepository,
  permissionService: legacyRpgPermissionService,
  imageGateway: imageKitGateway,
} as const
