import {
  buildSkillSlug,
  skillMetaPatchSchema,
} from "@/lib/validators/skillBuilder"
import type { SkillUpdateRepository } from "@/features/world/skill/application/ports/SkillRepository"
import { AppError } from "@/features/shared/application/errors/AppError"
import { mapSkillError } from "@/features/world/skill/application/use-cases/shared"

type UpdateSkillDeps = {
  repository: SkillUpdateRepository
}

export async function updateSkill(
  deps: UpdateSkillDeps,
  params: { skillId: string; userId: string; body: unknown },
) {
  try {
    const existing = await deps.repository.findById(
      params.skillId,
      params.userId,
    )
    if (!existing) {
      throw new AppError("Skill nao encontrada.", 404)
    }

    const parsed = skillMetaPatchSchema.safeParse(params.body)
    if (!parsed.success) {
      throw new AppError(
        parsed.error.issues[0]?.message ?? "Dados invalidos.",
        400,
      )
    }

    const classIds = parsed.data.classIds ?? existing.classIds
    const raceIds = parsed.data.raceIds ?? existing.raceIds
    const validatedLinks = await deps.repository.validateLinkIds({
      rpgId: existing.rpgId,
      classIds,
      raceIds,
    })
    if (!validatedLinks.ok) {
      throw new AppError(validatedLinks.message, 400)
    }

    const nextTags = parsed.data.tags ?? existing.tags
    const nextSlug = buildSkillSlug(parsed.data.slug ?? existing.slug)

    await deps.repository.updateSkillMeta({
      skillId: params.skillId,
      ownerId: params.userId,
      slug: nextSlug,
      tags: nextTags,
      classIds: parsed.data.classIds,
      raceIds: parsed.data.raceIds,
    })

    const updated = await deps.repository.findById(
      params.skillId,
      params.userId,
    )
    return { skill: updated }
  } catch (error) {
    mapSkillError(error, "Erro interno ao atualizar skill.")
  }
}
