import type { SkillRepository } from "@/application/skills/ports/SkillRepository"
import { AppError } from "@/shared/errors/AppError"

type GetSkillByIdDeps = {
  repository: SkillRepository
}

export async function getSkillById(
  deps: GetSkillByIdDeps,
  params: { skillId: string; userId: string },
) {
  try {
    const skill = await deps.repository.findById(params.skillId, params.userId)
    if (!skill) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    return { skill }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Error && error.message.includes('relation "skills" does not exist')) {
      throw new AppError("Tabela skills nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao buscar skill.", 500)
  }
}
