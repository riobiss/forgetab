import { AppError } from "@/shared/errors/AppError"
import type { SkillRepository } from "@/application/skills/ports/SkillRepository"

type GetSkillsDeps = {
  repository: SkillRepository
}

export async function getSkills(
  deps: GetSkillsDeps,
  params: { userId: string; rpgId?: string | null },
) {
  try {
    const skills = await deps.repository.listByOwner(params.userId, params.rpgId)
    return { skills }
  } catch (error) {
    if (error instanceof Error && error.message.includes('relation "skills" does not exist')) {
      throw new AppError("Tabela skills nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao buscar skills.", 500)
  }
}
