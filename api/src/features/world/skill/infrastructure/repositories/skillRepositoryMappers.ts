import type { Prisma } from "../../../../../../generated/prisma/client.js"
import type { SkillLevelDetails } from "@/features/world/skill/application/ports/SkillRepository"
import type { SkillLevelRow } from "@/features/world/skill/infrastructure/repositories/skillRepositoryRows.js"

function normalizeJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value
}

export function mapSkillLevel(level: SkillLevelRow): SkillLevelDetails {
  return {
    ...level,
    stats: normalizeJsonObject(level.stats),
    cost: normalizeJsonObject(level.cost),
    target: normalizeJsonObject(level.target),
    area: normalizeJsonObject(level.area),
    scaling: normalizeJsonObject(level.scaling),
    requirement: normalizeJsonObject(level.requirement)
  }
}
