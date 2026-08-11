import { prismaSkillRepository } from "@/features/world/skill/infrastructure/repositories/prismaSkillRepository"
import { rpgManagementPermissionService } from "@/features/world/infrastructure/services/rpgManagementPermissionService"
import { prismaSkillsSearchIndexRepository } from "@/features/world/skill/infrastructure/searchIndex/repositories/prismaSkillsSearchIndexRepository"

export const skillRouteDeps = {
  repository: prismaSkillRepository,
  permissionService: rpgManagementPermissionService,
  searchIndexRepository: prismaSkillsSearchIndexRepository
} as const
