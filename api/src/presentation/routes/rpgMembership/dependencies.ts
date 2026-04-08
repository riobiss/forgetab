import { prismaRpgMembershipRepository } from "@/infrastructure/rpgMembership/repositories/prismaRpgMembershipRepository"
import { rpgMembershipAccessService } from "@/infrastructure/rpgMembership/services/rpgMembershipAccessService"

export const rpgMembershipRouteDeps = {
  repository: prismaRpgMembershipRepository,
  accessService: rpgMembershipAccessService,
} as const
