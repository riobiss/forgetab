import { Prisma } from "../../../../../generated/prisma/client.js"
import { RpgManagementRepositoryError } from "@/application/rpg/management/errors/RpgManagementRepositoryError"

export function isMissingColumn(error: unknown, column: string) {
  return error instanceof Error && error.message.includes(`column "${column}" does not exist`)
}

export function isMissingAnyColumn(error: unknown, columns: string[]) {
  return columns.some((column) => isMissingColumn(error, column))
}

export function mapRpgRepositoryError(error: unknown): never {
  if (error instanceof RpgManagementRepositoryError) {
    throw error
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      throw new RpgManagementRepositoryError("RPG_TABLE_MISSING")
    }

    if (error.code === "P2003") {
      throw new RpgManagementRepositoryError("USER_REFERENCE_INVALID")
    }
  }

  if (!(error instanceof Error)) {
    throw error
  }

  if (error.message.includes('relation "rpgs" does not exist') || error.message.includes("Could not find the table")) {
    throw new RpgManagementRepositoryError("RPG_TABLE_MISSING")
  }

  if (isMissingColumn(error, "image")) {
    throw new RpgManagementRepositoryError("RPG_IMAGE_COLUMN_MISSING")
  }

  if (
    isMissingAnyColumn(error, [
      "costs_enabled",
      "cost_resource_name",
      "use_race_bonuses",
      "use_class_bonuses",
      "use_class_race_bonuses",
      "use_inventory_weight_limit",
      "allow_multiple_player_characters",
      "users_can_manage_own_xp",
      "allow_skill_point_distribution",
      "ability_categories_enabled",
      "enabled_ability_categories",
      "use_mundi_map",
      "progression_mode",
      "progression_tiers",
    ])
  ) {
    throw new RpgManagementRepositoryError("RPG_SCHEMA_OUTDATED")
  }

  throw error
}
