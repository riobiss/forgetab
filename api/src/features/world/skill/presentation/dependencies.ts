import { prismaSkillRepository } from "@/infrastructure/skills/repositories/prismaSkillRepository"
import { rpgPermissionService } from "@/infrastructure/skills/services/rpgPermissionService"
import { prismaSkillsSearchIndexRepository } from "@/infrastructure/skillsSearchIndex/repositories/prismaSkillsSearchIndexRepository"

export const skillRouteDeps = {
  repository: prismaSkillRepository,
  permissionService: rpgPermissionService,
  searchIndexRepository: prismaSkillsSearchIndexRepository,
} as const
