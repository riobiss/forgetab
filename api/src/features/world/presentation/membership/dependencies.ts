import { prismaRpgMembershipRepository } from "@/features/world/infrastructure/membership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/features/world/infrastructure/membership/services/rpgMembershipAccessService"

export const rpgMembershipRouteDeps = {
  repository: prismaRpgMembershipRepository,
  accessService: rpgMembershipAccessService
} as const
