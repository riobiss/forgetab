import type { SkillsPageAccessService } from "@/features/world/skill/application/page/ports/SkillsPageAccessService"
import type { SkillsPageRepository } from "@/features/world/skill/application/page/ports/SkillsPageRepository"

export async function loadSkillsPageUseCase(
  repository: SkillsPageRepository,
  accessService: SkillsPageAccessService,
  params: { rpgId: string; userId: string },
): Promise<{ rpg: { id: string; title: string } } | null> {
  const [rpg, canManage] = await Promise.all([
    repository.getRpgSummary(params.rpgId),
    accessService.canManageRpg(params.rpgId, params.userId),
  ])

  if (!rpg || !canManage) {
    return null
  }

  return { rpg }
}
