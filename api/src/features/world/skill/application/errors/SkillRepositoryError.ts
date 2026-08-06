export type SkillRepositoryErrorCode =
  | "duplicate_slug"
  | "skills_schema_missing"
  | "skill_levels_schema_missing"
  | "unknown"

export class SkillRepositoryError extends Error {
  constructor(
    readonly code: SkillRepositoryErrorCode,
    options?: ErrorOptions
  ) {
    super("Falha ao acessar a persistencia de habilidades.", options)
    this.name = "SkillRepositoryError"
  }
}
