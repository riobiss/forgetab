export type RpgConfigRepositoryErrorCode =
  | "attribute_schema_missing"
  | "status_schema_missing"
  | "skill_schema_missing"
  | "race_schema_missing"
  | "class_schema_missing"
  | "identity_schema_missing"
  | "characteristic_schema_missing"
  | "unknown"

export class RpgConfigRepositoryError extends Error {
  constructor(
    readonly code: RpgConfigRepositoryErrorCode,
    options?: ErrorOptions
  ) {
    super("Falha ao acessar a persistencia de configuracao do RPG.", options)
    this.name = "RpgConfigRepositoryError"
  }
}
