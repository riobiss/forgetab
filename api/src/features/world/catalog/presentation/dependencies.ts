import { prismaEntityCatalogDetailRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogDetailRepository"
import { prismaEntityCatalogRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogRepository"
import { entityCatalogDetailAccessService } from "@/features/world/catalog/infrastructure/services/entityCatalogDetailAccessService"
import { entityCatalogPageAccessService } from "@/features/world/catalog/infrastructure/services/entityCatalogPageAccessService"
import { prismaEntityCatalogAbilityRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogAbilitiesRepository"
import { prismaEntityCatalogPlayerRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogPlayersRepository"
import { prismaEntityCatalogPurchaseRepository } from "@/features/world/catalog/infrastructure/repositories/prismaEntityCatalogPurchaseRepository"

export const entityCatalogRouteDeps = {
  repository: prismaEntityCatalogRepository,
  pageAccessService: entityCatalogPageAccessService,
  detailRepository: prismaEntityCatalogDetailRepository,
  abilityRepository: prismaEntityCatalogAbilityRepository,
  playerRepository: prismaEntityCatalogPlayerRepository,
  purchaseRepository: prismaEntityCatalogPurchaseRepository,
  detailAccessService: entityCatalogDetailAccessService,
} as const
