import { prismaRpgConfigRepository } from "@/features/world/infrastructure/config/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/features/world/infrastructure/config/services/rpgConfigAccessService"

export const rpgConfigRouteDeps = {
  accessService: rpgConfigAccessService,
  repository: prismaRpgConfigRepository
} as const
