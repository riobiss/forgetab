import { AppError } from "@/shared/errors/AppError"
import { RpgManagementRepositoryError } from "@/application/rpgManagement/errors/RpgManagementRepositoryError"

export function mapRpgManagementRepositoryError(
  error: unknown,
  fallbackMessage: string,
): AppError | null {
  if (!(error instanceof RpgManagementRepositoryError)) {
    return null
  }

  switch (error.code) {
    case "RPG_TABLE_MISSING":
      return new AppError("Tabela de RPG nao existe no banco. Rode a migration.", 500)
    case "RPG_SCHEMA_OUTDATED":
    case "RPG_IMAGE_COLUMN_MISSING":
      return new AppError("Estrutura de RPG desatualizada. Rode a migration mais recente.", 500)
    case "USER_REFERENCE_INVALID":
      return new AppError("Usuario do token nao existe no banco atual.", 409)
    default:
      return new AppError(fallbackMessage, 500)
  }
}
