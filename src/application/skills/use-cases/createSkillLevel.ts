import { deepCopyJson } from "@/lib/server/skillBuilder"
import { skillLevelCreateSchema } from "@/lib/validators/skillBuilder"
import type { SkillRepository } from "@/application/skills/ports/SkillRepository"
import { AppError } from "@/shared/errors/AppError"

type CreateSkillLevelDeps = {
  repository: SkillRepository
}

export async function createSkillLevel(
  deps: CreateSkillLevelDeps,
  params: { skillId: string; userId: string; body: unknown },
) {
  try {
    const skill = await deps.repository.findById(params.skillId, params.userId)
    if (!skill) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    const parsed = skillLevelCreateSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(parsed.error.issues[0]?.message ?? "Dados invalidos.", 400)
    }

    const lastLevel = skill.levels[skill.levels.length - 1]
    const nextLevelNumber = (lastLevel?.levelNumber ?? 0) + 1
    const payload = parsed.data

    const nextSummary = payload.summary !== undefined ? payload.summary : lastLevel?.summary ?? null
    const nextLevelRequired =
      payload.levelRequired !== undefined
        ? payload.levelRequired
        : (lastLevel?.levelRequired ?? nextLevelNumber)
    const nextStats =
      payload.stats !== undefined ? payload.stats : deepCopyJson(lastLevel?.stats ?? null)
    const nextCost = payload.cost !== undefined ? payload.cost : deepCopyJson(lastLevel?.cost ?? null)
    const nextTarget =
      payload.target !== undefined ? payload.target : deepCopyJson(lastLevel?.target ?? null)
    const nextArea = payload.area !== undefined ? payload.area : deepCopyJson(lastLevel?.area ?? null)
    const nextScaling =
      payload.scaling !== undefined ? payload.scaling : deepCopyJson(lastLevel?.scaling ?? null)
    const nextRequirement =
      payload.requirement !== undefined
        ? payload.requirement
        : deepCopyJson(lastLevel?.requirement ?? null)
    const nextRequirementWithUpgrade =
      lastLevel
        ? {
            ...(nextRequirement && typeof nextRequirement === "object" ? nextRequirement : {}),
            upgradeFromSkillId: params.skillId,
            upgradeFromLevelId: lastLevel.id,
            upgradeFromLevelNumber: lastLevel.levelNumber,
          }
        : nextRequirement

    await deps.repository.createLevel({
      skillId: params.skillId,
      levelNumber: nextLevelNumber,
      levelRequired: nextLevelRequired,
      summary: nextSummary,
      stats: nextStats,
      cost: nextCost,
      target: nextTarget,
      area: nextArea,
      scaling: nextScaling,
      requirement: nextRequirementWithUpgrade,
    })

    const updatedSkill = await deps.repository.findById(params.skillId, params.userId)
    return { skill: updatedSkill }
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Error && error.message.includes('relation "skill_levels" does not exist')) {
      throw new AppError("Tabela skill_levels nao existe no banco. Rode a migration.", 500)
    }

    throw new AppError("Erro interno ao criar level.", 500)
  }
}
