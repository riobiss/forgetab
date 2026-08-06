export type RpgMembershipRepositoryErrorCode =
  "members_schema_missing" | "character_requests_schema_missing" | "unknown"

export class RpgMembershipRepositoryError extends Error {
  constructor(
    readonly code: RpgMembershipRepositoryErrorCode,
    options?: ErrorOptions
  ) {
    super("Falha ao acessar a persistencia de membros do RPG.", options)
    this.name = "RpgMembershipRepositoryError"
  }
}
