import { normalizeRpgVisibility } from "@/infrastructure/shared/normalizeRpgVisibility"
import type { RpgCreateBaseResult, RpgRow } from "@/application/rpg/management/types"

type RpgVisibilityRow = {
  visibility: string
}

export function mapRpgRow<T extends RpgRow & RpgVisibilityRow>(row: T): RpgRow {
  return {
    ...row,
    visibility: normalizeRpgVisibility(row.visibility),
  }
}

export function mapRpgCreateBaseResult(
  row: {
    id: string
    ownerId: string
    title: string
    description: string
    visibility: string
    createdAt: Date
  },
): RpgCreateBaseResult {
  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    description: row.description,
    visibility: normalizeRpgVisibility(row.visibility),
    createdAt: row.createdAt,
  }
}
