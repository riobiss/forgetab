import { prismaEntityCatalogDetailRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogDetailRepository"
import { prismaEntityCatalogRepository } from "@/infrastructure/entityCatalog/repositories/prismaEntityCatalogRepository"
import { entityCatalogDetailAccessService } from "@/infrastructure/entityCatalog/services/entityCatalogDetailAccessService"

export const entityCatalogRouteDeps = {
  repository: prismaEntityCatalogRepository,
  detailRepository: prismaEntityCatalogDetailRepository,
  detailAccessService: entityCatalogDetailAccessService,
} as const
