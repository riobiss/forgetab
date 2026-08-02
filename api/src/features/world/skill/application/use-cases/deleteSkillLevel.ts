import type { SkillLevelDeleteRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type DeleteSkillLevelDeps = {
  repository: SkillLevelDeleteRepository
}

export async function deleteSkillLevel(
  deps: DeleteSkillLevelDeps,
  params: {
    skillId: string
    levelId: string
    userId: string
  },
) {
  try {
    const skill = await deps.repository.findById(params.skillId, params.userId)
    if (!skill) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    const level = skill.levels.find((item) => item.id === params.levelId)
    if (!level) {
      throw new AppError("Level nao encontrado.", 404)
    }

    if (skill.levels.length <= 1) {
      throw new AppError(
        "Nao e possivel remover o ultimo level da habilidade.",
        400,
      )
    }

    await deps.repository.deleteLevel(params.skillId, params.levelId)
    const updatedSkill = await deps.repository.findById(
      params.skillId,
      params.userId,
    )
    return { skill: updatedSkill }
  } catch (error) {
    mapSkillError(error, "Erro interno ao remover level.")
  }
}
