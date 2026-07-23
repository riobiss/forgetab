import { prismaSkillRepository } from "@/features/world/skill/infrastructure/repositories/prismaSkillRepository"
import { rpgPermissionService } from "@/features/world/skill/infrastructure/services/rpgPermissionService"
import { prismaSkillsSearchIndexRepository } from "@/features/skillsSearchIndex/infrastructure/repositories/prismaSkillsSearchIndexRepository"

export const skillRouteDeps = {
  repository: prismaSkillRepository,
  permissionService: rpgPermissionService,
  searchIndexRepository: prismaSkillsSearchIndexRepository,
} as const
