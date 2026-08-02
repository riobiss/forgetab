import { skillLevelPatchSchema } from "@/lib/validators/skillBuilder"
import type { SkillLevelUpdateRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type UpdateSkillLevelDeps = {
  repository: SkillLevelUpdateRepository
}

export async function updateSkillLevel(
  deps: UpdateSkillLevelDeps,
  params: {
    skillId: string
    levelId: string
    userId: string
    body: unknown
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

    const parsed = skillLevelPatchSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Dados invalidos.",
        400,
      )
    }

    const nextLevelRequired = parsed.data.levelRequired ?? level.levelRequired
    const nextSummary =
      parsed.data.summary !== undefined ? parsed.data.summary : level.summary
    const nextStats =
      parsed.data.stats !== undefined ? parsed.data.stats : level.stats
    const nextCost =
      parsed.data.cost !== undefined ? parsed.data.cost : level.cost
    const nextTarget =
      parsed.data.target !== undefined ? parsed.data.target : level.target
    const nextArea =
      parsed.data.area !== undefined ? parsed.data.area : level.area
    const nextScaling =
      parsed.data.scaling !== undefined ? parsed.data.scaling : level.scaling
    const nextRequirement =
      parsed.data.requirement !== undefined
        ? parsed.data.requirement
        : level.requirement

    await deps.repository.updateLevel({
      skillId: params.skillId,
      levelId: params.levelId,
      levelRequired: nextLevelRequired,
      summary: nextSummary ?? null,
      stats: nextStats,
      cost: nextCost,
      target: nextTarget,
      area: nextArea,
      scaling: nextScaling,
      requirement: nextRequirement,
    })

    const updatedSkill = await deps.repository.findById(
      params.skillId,
      params.userId,
    )
    return { skill: updatedSkill }
  } catch (error) {
    mapSkillError(error, "Erro interno ao atualizar level.")
  }
}
