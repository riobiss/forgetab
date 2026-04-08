import { prismaRpgMapRepository } from "@/infrastructure/rpgMap/repositories/prismaRpgMapRepository"
import { rpgMapAccessService } from "@/infrastructure/rpgMap/services/rpgMapAccessService"

export const rpgMapRouteDeps = {
  repository: prismaRpgMapRepository,
  accessService: rpgMapAccessService,
} as const
