import { prismaRpgConfigRepository } from "@/infrastructure/rpg/config/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpg/config/services/rpgConfigAccessService"

export const rpgConfigRouteDeps = {
  accessService: rpgConfigAccessService,
  repository: prismaRpgConfigRepository,
} as const
