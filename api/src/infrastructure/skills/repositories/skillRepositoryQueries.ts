import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { normalizeEnabledAbilityCategories } from "@/lib/rpg/abilityCategories"
import { createRpgScope } from "@/lib/validators/skillBuilder"
import type {
  AbilityCategoryConfig,
  LinkValidationResult,
  SkillDetails,
} from "@/application/skills/ports/SkillRepository"
import { mapSkillLevel } from "@/infrastructure/skills/repositories/skillRepositoryMappers"
import type {
  SkillLevelRow,
  SkillRow,
} from "@/infrastructure/skills/repositories/skillRepositoryRows"

export async function listSkillsByOwner(ownerId: string, rpgId?: string | null) {
  let rows: SkillRow[] = []
  try {
    rows = await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        rpg_id AS "rpgId",
        rpg_scope AS "rpgScope",
        slug,
        COALESCE(tags, ARRAY[]::text[]) AS tags,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM skills
      WHERE owner_id = ${ownerId}
        ${rpgId ? Prisma.sql`AND rpg_id = ${rpgId}` : Prisma.sql``}
      ORDER BY updated_at DESC
    `)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
      throw error
    }

    rows = await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        rpg_id AS "rpgId",
        rpg_scope AS "rpgScope",
        slug,
        ARRAY[]::text[] AS tags,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM skills
      WHERE owner_id = ${ownerId}
        ${rpgId ? Prisma.sql`AND rpg_id = ${rpgId}` : Prisma.sql``}
      ORDER BY updated_at DESC
    `)
  }

  return rows
}

export async function getRpgAbilityCategoryConfig(rpgId: string | null): Promise<AbilityCategoryConfig> {
  if (!rpgId) {
    return { enabled: false, categories: [] }
  }

  try {
    const rows = await prisma.$queryRaw<Array<{ enabled: boolean; categories: string[] }>>(Prisma.sql`
      SELECT
        COALESCE(ability_categories_enabled, false) AS enabled,
        COALESCE(enabled_ability_categories, ARRAY[]::text[]) AS categories
      FROM rpgs
      WHERE id = ${rpgId}
      LIMIT 1
    `)

    const row = rows[0]
    return {
      enabled: Boolean(row?.enabled),
      categories: normalizeEnabledAbilityCategories(row?.categories),
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('column "ability_categories_enabled" does not exist') ||
        error.message.includes('column "enabled_ability_categories" does not exist'))
    ) {
      return { enabled: false, categories: [] }
    }

    throw error
  }
}

export async function validateSkillLinkIds(params: {
  rpgId: string | null
  classIds: string[]
  raceIds: string[]
}): Promise<LinkValidationResult> {
  if (!params.rpgId && (params.classIds.length > 0 || params.raceIds.length > 0)) {
    return {
      ok: false,
      message: "Vinculos de classe/raca exigem um rpgId.",
    }
  }

  if (!params.rpgId) {
    return { ok: true }
  }

  if (params.classIds.length > 0) {
    const classMatches = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_class_templates
      WHERE rpg_id = ${params.rpgId}
        AND id IN (${Prisma.join(params.classIds)})
    `)

    if (classMatches.length !== params.classIds.length) {
      return {
        ok: false,
        message: "Uma ou mais classes informadas sao invalidas para este RPG.",
      }
    }
  }

  if (params.raceIds.length > 0) {
    const raceMatches = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM rpg_race_templates
      WHERE rpg_id = ${params.rpgId}
        AND id IN (${Prisma.join(params.raceIds)})
    `)

    if (raceMatches.length !== params.raceIds.length) {
      return {
        ok: false,
        message: "Uma ou mais racas informadas sao invalidas para este RPG.",
      }
    }
  }

  return { ok: true }
}

export async function findSkillById(skillId: string, ownerId: string): Promise<SkillDetails | null> {
  let skills: SkillRow[] = []
  try {
    skills = await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        rpg_id AS "rpgId",
        rpg_scope AS "rpgScope",
        slug,
        COALESCE(tags, ARRAY[]::text[]) AS tags,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM skills
      WHERE id = ${skillId}
        AND owner_id = ${ownerId}
      LIMIT 1
    `)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
      throw error
    }

    skills = await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
      SELECT
        id,
        owner_id AS "ownerId",
        rpg_id AS "rpgId",
        rpg_scope AS "rpgScope",
        slug,
        ARRAY[]::text[] AS tags,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM skills
      WHERE id = ${skillId}
        AND owner_id = ${ownerId}
      LIMIT 1
    `)
  }

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
    levels: levels.map(mapSkillLevel),
  }
}

export { createRpgScope }
