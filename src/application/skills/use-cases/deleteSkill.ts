import type { SkillRepository } from "@/application/skills/ports/SkillRepository"
import { AppError } from "@/shared/errors/AppError"

type DeleteSkillDeps = {
  repository: SkillRepository
}

export async function deleteSkill(
  deps: DeleteSkillDeps,
  params: { skillId: string; userId: string },
) {
  try {
    const existing = await deps.repository.findById(params.skillId, params.userId)
    if (!existing) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    await deps.repository.deleteSkill(params.skillId, params.userId)
    return { id: params.skillId, rpgId: existing.rpgId }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Error && error.message.includes('relation "skills" does not exist')) {
      throw new AppError("Tabela skills nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao remover skill.", 500)
  }
}
