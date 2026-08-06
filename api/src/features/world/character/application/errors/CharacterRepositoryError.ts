export type CharacterRepositoryErrorCode =
  | "character_schema_missing"
  | "character_schema_outdated"
  | "template_schema_missing"
  | "progression_schema_outdated"
  | "ability_schema_outdated"
  | "unknown"

export class CharacterRepositoryError extends Error {
  constructor(
    readonly code: CharacterRepositoryErrorCode,
    options?: ErrorOptions
  ) {
    super("Falha ao acessar a persistencia de personagens.", options)
    this.name = "CharacterRepositoryError"
  }
}
