import type { SkillRepository } from "@/application/skills/ports/SkillRepository"
import { AppError } from "@/shared/errors/AppError"

type DeleteSkillLevelDeps = {
  repository: SkillRepository
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
      throw new AppError("Nao e possivel remover o ultimo level da habilidade.", 400)
    }

    await deps.repository.deleteLevel(params.skillId, params.levelId)
    const updatedSkill = await deps.repository.findById(params.skillId, params.userId)
    return { skill: updatedSkill }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Error && error.message.includes('relation "skill_levels" does not exist')) {
      throw new AppError("Tabela skill_levels nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao remover level.", 500)
  }
}
