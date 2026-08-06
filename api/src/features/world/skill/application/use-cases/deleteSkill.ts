import type { SkillDeleteRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type DeleteSkillDeps = {
  repository: SkillDeleteRepository
}

export async function deleteSkill(
  deps: DeleteSkillDeps,
  params: { skillId: string; userId: string }
) {
  try {
    const existing = await deps.repository.findById(
      params.skillId,
      params.userId
    )
    if (!existing) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    await deps.repository.deleteSkill(params.skillId, params.userId)
    return { id: params.skillId, rpgId: existing.rpgId }
  } catch (error) {
    mapSkillError(error, "Erro interno ao remover skill.")
  }
}
