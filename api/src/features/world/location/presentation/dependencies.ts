import { prismaRpgMapRepository } from "@/infrastructure/rpg/map/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpg/map/services/rpgMapAccessService"

export const rpgMapRouteDeps = {
  repository: prismaRpgMapRepository,
  accessService: rpgMapAccessService,
} as const
