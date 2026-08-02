import { SkillRepositoryError } from "@/features/world/skill/application/errors/SkillRepositoryError"
import type { SkillRepository } from "@/features/world/skill/application/ports/SkillRepository"

export function toSkillRepositoryError(error: unknown) {
  if (error instanceof SkillRepositoryError) {
    return error
  }

  const message = error instanceof Error ? error.message : ""
  if (message.includes("skills_owner_id_rpg_scope_slug_key")) {
    return new SkillRepositoryError("duplicate_slug", { cause: error })
  }
  if (message.includes('relation "skill_levels" does not exist')) {
    return new SkillRepositoryError("skill_levels_schema_missing", {
      cause: error,
    })
  }
  if (message.includes('relation "skills" does not exist')) {
    return new SkillRepositoryError("skills_schema_missing", { cause: error })
  }

  return new SkillRepositoryError("unknown", { cause: error })
}

export async function withSkillPersistenceErrors<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw toSkillRepositoryError(error)
  }
}

export function withSkillRepositoryErrors(
  repository: SkillRepository,
): SkillRepository {
  return {
    listByOwner: (...args) =>
      withSkillPersistenceErrors(() => repository.listByOwner(...args)),
    getAbilityCategoryConfig: (...args) =>
      withSkillPersistenceErrors(() =>
        repository.getAbilityCategoryConfig(...args),
      ),
    validateLinkIds: (...args) =>
      withSkillPersistenceErrors(() => repository.validateLinkIds(...args)),
    createSkillRecord: (...args) =>
      withSkillPersistenceErrors(() => repository.createSkillRecord(...args)),
    findById: (...args) =>
      withSkillPersistenceErrors(() => repository.findById(...args)),
    updateSkillMeta: (...args) =>
      withSkillPersistenceErrors(() => repository.updateSkillMeta(...args)),
    createLevel: (...args) =>
      withSkillPersistenceErrors(() => repository.createLevel(...args)),
    updateLevel: (...args) =>
      withSkillPersistenceErrors(() => repository.updateLevel(...args)),
    deleteLevel: (...args) =>
      withSkillPersistenceErrors(() => repository.deleteLevel(...args)),
    deleteSkill: (...args) =>
      withSkillPersistenceErrors(() => repository.deleteSkill(...args)),
  }
}
