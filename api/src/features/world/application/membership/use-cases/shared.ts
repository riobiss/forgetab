import { AppError } from "@/features/shared/application/errors/AppError"
import { RpgMembershipRepositoryError } from "@/features/world/application/membership/errors/RpgMembershipRepositoryError"

export function wrapMembersError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (
    error instanceof RpgMembershipRepositoryError &&
    error.code === "members_schema_missing"
  ) {
    throw new AppError("Tabela de membros nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

export function wrapCharacterRequestsError(error: unknown, fallbackMessage: string): never {
  if (error instanceof AppError) throw error
  if (
    error instanceof RpgMembershipRepositoryError &&
    error.code === "character_requests_schema_missing"
  ) {
    throw new AppError(
      "Tabela de solicitacoes de criacao de personagem nao existe no banco. Rode a migration.",
      500,
    )
  }
  if (
    error instanceof RpgMembershipRepositoryError &&
    error.code === "members_schema_missing"
  ) {
    throw new AppError("Tabela de membros nao existe no banco. Rode a migration.", 500)
  }
  throw new AppError(fallbackMessage, 500)
}

