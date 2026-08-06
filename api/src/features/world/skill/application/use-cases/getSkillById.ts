import type { SkillDetailRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type GetSkillByIdDeps = {
  repository: SkillDetailRepository
}

export async function getSkillById(
  deps: GetSkillByIdDeps,
  params: { skillId: string; userId: string }
) {
  try {
    const skill = await deps.repository.findById(params.skillId, params.userId)
    if (!skill) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    return { skill }
  } catch (error) {
    mapSkillError(error, "Erro interno ao buscar skill.")
  }
}
