import { NextRequest } from "next/server"
import { Prisma } from "../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { TOKEN_COOKIE_NAME, verifyAuthToken } from "@/lib/auth/token"

type SkillRow = {
  id: string
  ownerId: string
  rpgId: string | null
  rpgScope: string
  name: string
  slug: string
  category: string | null
  type: string | null
  description: string | null
  currentLevel: number
  createdAt: Date
  updatedAt: Date
}

type SkillLevelRow = {
  id: string
  skillId: string
  levelNumber: number
  levelRequired: number
  summary: string | null
  stats: Prisma.JsonValue
  cost: Prisma.JsonValue
  target: Prisma.JsonValue
  area: Prisma.JsonValue
  scaling: Prisma.JsonValue
  requirement: Prisma.JsonValue
  effects: Prisma.JsonValue
  createdAt: Date
  updatedAt: Date
}

function normalizeJsonObject(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  return value
}

function normalizeJsonArray(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
}

export async function getUserIdFromRequest(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const payload = await verifyAuthToken(token)
    return payload.userId
  } catch {
    return null
  }
}

export async function canAccessOwnedRpg(rpgId: string, userId: string) {
  const rpg = await prisma.rpg.findFirst({
    where: { id: rpgId, ownerId: userId },
    select: { id: true },
  })

  return Boolean(rpg)
}

export async function skillBelongsToUser(skillId: string, userId: string) {
  const skill = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id
    FROM skills
    WHERE id = ${skillId}
      AND owner_id = ${userId}
    LIMIT 1
  `)

  return skill.length > 0
}

export async function validateLinkIds({
  rpgId,
  classIds,
  raceIds,
}: {
  rpgId: string | null
  classIds: string[]
  raceIds: string[]
}) {
  if (!rpgId && (classIds.length > 0 || raceIds.length > 0)) {
    return {
      ok: false as const,
      message: "Vinculos de classe/raca exigem um rpgId.",
    }
  }

  if (!rpgId) {
    return { ok: true as const }
  }

  if (classIds.length > 0) {
    const classMatches = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_class_templates
      WHERE rpg_id = ${rpgId}
        AND id IN (${Prisma.join(classIds)})
    `)

    if (classMatches.length !== classIds.length) {
      return {
        ok: false as const,
        message: "Uma ou mais classes informadas sao invalidas para este RPG.",
      }
    }
  }

  if (raceIds.length > 0) {
    const raceMatches = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_race_templates
      WHERE rpg_id = ${rpgId}
        AND id IN (${Prisma.join(raceIds)})
    `)

    if (raceMatches.length !== raceIds.length) {
      return {
        ok: false as const,
        message: "Uma ou mais racas informadas sao invalidas para este RPG.",
      }
    }
  }

  return { ok: true as const }
}

export async function fetchSkillById(skillId: string, ownerId: string) {
  const skills = await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
    SELECT
      id,
      owner_id AS "ownerId",
      rpg_id AS "rpgId",
      rpg_scope AS "rpgScope",
      name,
      slug,
      category,
      type,
      description,
      current_level AS "currentLevel",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM skills
    WHERE id = ${skillId}
      AND owner_id = ${ownerId}
    LIMIT 1
  `)

  if (skills.length === 0) {
    return null
  }

  const classRows = await prisma.$queryRaw<Array<{ classTemplateId: string }>>(Prisma.sql`
    SELECT class_template_id AS "classTemplateId"
    FROM skill_class_links
    WHERE skill_id = ${skillId}
  `)

  const raceRows = await prisma.$queryRaw<Array<{ raceTemplateId: string }>>(Prisma.sql`
    SELECT race_template_id AS "raceTemplateId"
    FROM skill_race_links
    WHERE skill_id = ${skillId}
  `)

  const levels = await prisma.$queryRaw<SkillLevelRow[]>(Prisma.sql`
    SELECT
      id,
      skill_id AS "skillId",
      level_number AS "levelNumber",
      level_required AS "levelRequired",
      summary,
      stats,
      cost,
      target,
      area,
      scaling,
      requirement,
      effects,
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM skill_levels
    WHERE skill_id = ${skillId}
    ORDER BY level_number ASC
  `)

  return {
    ...skills[0],
    classIds: classRows.map((item) => item.classTemplateId),
    raceIds: raceRows.map((item) => item.raceTemplateId),
    levels: levels.map((level) => ({
      ...level,
      stats: normalizeJsonObject(level.stats),
      cost: normalizeJsonObject(level.cost),
      target: normalizeJsonObject(level.target),
      area: normalizeJsonObject(level.area),
      scaling: normalizeJsonObject(level.scaling),
      requirement: normalizeJsonObject(level.requirement),
      effects: normalizeJsonArray(level.effects),
    })),
  }
}

export async function fetchSkillList(ownerId: string, rpgId?: string | null) {
  const rows = await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
    SELECT
      id,
      owner_id AS "ownerId",
      rpg_id AS "rpgId",
      rpg_scope AS "rpgScope",
      name,
      slug,
      category,
      type,
      description,
      current_level AS "currentLevel",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM skills
    WHERE owner_id = ${ownerId}
      ${rpgId ? Prisma.sql`AND rpg_id = ${rpgId}` : Prisma.sql``}
    ORDER BY updated_at DESC
  `)

  return rows
}

export function toJsonOrNull(value: unknown) {
  if (value === undefined || value === null) return null
  return JSON.stringify(value)
}

export function deepCopyJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
