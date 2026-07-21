import { prismaRpgMembershipRepository } from "@/infrastructure/rpg/membership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/infrastructure/rpg/membership/services/rpgMembershipAccessService"

export const rpgMembershipRouteDeps = {
  repository: prismaRpgMembershipRepository,
  accessService: rpgMembershipAccessService,
} as const
