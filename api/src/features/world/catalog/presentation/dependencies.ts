import { prismaEntityCatalogDetailRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogDetailRepository"
import { prismaEntityCatalogRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogRepository"
import { entityCatalogDetailAccessService } from "@/features/world/catalog/infrastructure/services/entityCatalogDetailAccessService"

export const entityCatalogRouteDeps = {
  repository: prismaEntityCatalogRepository,
  detailRepository: prismaEntityCatalogDetailRepository,
  detailAccessService: entityCatalogDetailAccessService,
} as const
