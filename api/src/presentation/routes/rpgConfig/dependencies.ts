import { prismaRpgConfigRepository } from "@/infrastructure/rpgConfig/repositories/prismaRpgConfigRepository"
import { rpgConfigAccessService } from "@/infrastructure/rpgConfig/services/rpgConfigAccessService"

export const rpgConfigRouteDeps = {
  accessService: rpgConfigAccessService,
  repository: prismaRpgConfigRepository,
} as const
