import { AppError } from "@/features/shared/application/errors/AppError"
import { SkillRepositoryError } from "@/features/world/skill/application/errors/SkillRepositoryError"

export function mapSkillError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) {
    throw error
  }

  if (error instanceof SkillRepositoryError) {
    switch (error.code) {
      case "duplicate_slug":
        throw new AppError("Slug ja utilizado neste escopo (owner + rpg).", 409)
      case "skills_schema_missing":
        throw new AppError(
          "Tabela skills nao existe no banco. Rode a migration.",
          500,
        )
      case "skill_levels_schema_missing":
        throw new AppError(
          "Tabela skill_levels nao existe no banco. Rode a migration.",
          500,
        )
    }
  }

  throw new AppError(fallbackMessage, 500)
}
