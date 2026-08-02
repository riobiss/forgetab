import type { SkillListRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type GetSkillsDeps = {
  repository: SkillListRepository
}

export async function getSkills(
  deps: GetSkillsDeps,
  params: { userId: string; rpgId?: string | null },
) {
  try {
    const skills = await deps.repository.listByOwner(
      params.userId,
      params.rpgId,
    )
    return { skills }
  } catch (error) {
    mapSkillError(error, "Erro interno ao buscar skills.")
  }
}
