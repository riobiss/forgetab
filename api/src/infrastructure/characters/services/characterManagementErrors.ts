import { AppError } from "@/shared/errors/AppError"

export function fail(status: number, message: string): never {
  throw new AppError(message, status)
}

export function rethrowCharacterManagementInfrastructureError(error: unknown): never {
  if (error instanceof AppError) throw error
  if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
    fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
  }
  if (
    error instanceof Error &&
    error.message.includes('column "visibility" of relation "rpg_characters" does not exist')
  ) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (error instanceof Error && error.message.includes('column "skills" of relation "rpg_characters" does not exist')) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (error instanceof Error && error.message.includes('column "image" of relation "rpg_characters" does not exist')) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (
    error instanceof Error &&
    (error.message.includes('column "progression_mode" of relation "rpg_characters" does not exist') ||
      error.message.includes('column "progression_label" of relation "rpg_characters" does not exist') ||
      error.message.includes('column "progression_required" of relation "rpg_characters" does not exist') ||
      error.message.includes('column "progression_current" of relation "rpg_characters" does not exist'))
  ) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (error instanceof Error && error.message.includes('column "identity" of relation "rpg_characters" does not exist')) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (
    error instanceof Error &&
    error.message.includes('column "characteristics" of relation "rpg_characters" does not exist')
  ) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (
    error instanceof Error &&
    error.message.includes('column "current_statuses" of relation "rpg_characters" does not exist')
  ) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (
    error instanceof Error &&
    error.message.includes('column "max_carry_weight" of relation "rpg_characters" does not exist')
  ) {
    fail(500, "Estrutura de personagens desatualizada. Rode a migration mais recente.")
  }
  if (error instanceof Error && error.message.includes('column "use_inventory_weight_limit" does not exist')) {
    fail(500, "Estrutura de RPG desatualizada. Rode a migration mais recente.")
  }
  if (
    error instanceof Error &&
    (error.message.includes('column "progression_mode" does not exist') ||
      error.message.includes('column "progression_tiers" does not exist'))
  ) {
    fail(500, "Estrutura de RPG desatualizada. Rode a migration mais recente.")
  }
  if (
    error instanceof Error &&
    error.message.includes('relation "rpg_character_identity_templates" does not exist')
  ) {
    fail(500, "Tabela de identidade de personagem nao existe no banco. Rode a migration.")
  }
  if (
    error instanceof Error &&
    error.message.includes('relation "rpg_character_characteristic_templates" does not exist')
  ) {
    fail(500, "Tabela de caracteristicas de personagem nao existe no banco. Rode a migration.")
  }
  throw error
}

export function rethrowCharacterDeleteInfrastructureError(error: unknown): never {
  if (error instanceof AppError) throw error
  if (error instanceof Error && error.message.includes('relation "rpg_characters" does not exist')) {
    fail(500, "Tabela de personagens nao existe no banco. Rode a migration.")
  }
  throw error
}
