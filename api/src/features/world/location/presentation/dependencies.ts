import { prismaRpgMapRepository } from "@/features/world/infrastructure/map/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/features/world/infrastructure/map/services/rpgMapAccessService"

export const rpgMapRouteDeps = {
  repository: prismaRpgMapRepository,
  accessService: rpgMapAccessService,
} as const
