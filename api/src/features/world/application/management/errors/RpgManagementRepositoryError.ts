export type RpgManagementRepositoryErrorCode =
  | "RPG_TABLE_MISSING"
  | "RPG_SCHEMA_OUTDATED"
  | "RPG_IMAGE_COLUMN_MISSING"
  | "USER_REFERENCE_INVALID"

export class RpgManagementRepositoryError extends Error {
  constructor(public readonly code: RpgManagementRepositoryErrorCode, message?: string) {
    super(message ?? code)
    this.name = "RpgManagementRepositoryError"
  }
}
