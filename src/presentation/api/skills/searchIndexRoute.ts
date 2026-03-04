import { NextRequest, NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { Prisma } from "../../../../generated/prisma/client.js"
import { prisma } from "@/lib/prisma"
import { getUserIdFromRequest } from "@/lib/server/skillBuilder"
import { buildSkillsIndexTagList } from "@/presentation/api/skills/cacheTags"

type SkillRow = {
  skillId: string
  slug: string
  tags: string[]
  levelNumber: number | null
  stats: Prisma.JsonValue
}

function normalizeStats(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

function toNonEmptyString(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

async function querySkillRows(params: { userId: string; skillIds: string[]; rpgId?: string | null }) {
  try {
    return await prisma.$queryRaw<SkillRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "slug",
        COALESCE(s.tags, ARRAY[]::text[]) AS tags,
        sl.level_number AS "levelNumber",
        sl.stats AS "stats"
      FROM skills s
      LEFT JOIN skill_levels sl ON sl.skill_id = s.id
      WHERE s.owner_id = ${params.userId}
        AND s.id IN (${Prisma.join(params.skillIds)})
        ${params.rpgId ? Prisma.sql`AND s.rpg_id = ${params.rpgId}` : Prisma.sql``}
      ORDER BY s.updated_at DESC, sl.level_number ASC
    `)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('column "tags" does not exist')) {
      throw error
    }
    return prisma.$queryRaw<SkillRow[]>(Prisma.sql`
      SELECT
        s.id AS "skillId",
        s.slug AS "slug",
        ARRAY[]::text[] AS tags,
        sl.level_number AS "levelNumber",
        sl.stats AS "stats"
      FROM skills s
      LEFT JOIN skill_levels sl ON sl.skill_id = s.id
      WHERE s.owner_id = ${params.userId}
        AND s.id IN (${Prisma.join(params.skillIds)})
        ${params.rpgId ? Prisma.sql`AND s.rpg_id = ${params.rpgId}` : Prisma.sql``}
      ORDER BY s.updated_at DESC, sl.level_number ASC
    `)
  }
}

function buildSearchIndex(rows: SkillRow[]) {
  const bySkill = new Map<
    string,
    {
      slug: string
      tags: string[]
      displayName: string
      searchParts: string[]
      categories: Set<string>
      types: Set<string>
      actionTypes: Set<string>
    }
  >()

  for (const row of rows) {
    if (!bySkill.has(row.skillId)) {
      bySkill.set(row.skillId, {
        slug: row.slug,
        tags: (row.tags ?? []).map((item) => item.trim()).filter((item) => item.length > 0),
        displayName: row.slug,
        searchParts: [],
        categories: new Set<string>(),
        types: new Set<string>(),
        actionTypes: new Set<string>(),
      })
    }

    const bucket = bySkill.get(row.skillId)
    if (!bucket) continue

    const stats = normalizeStats(row.stats)
    const name = toNonEmptyString(stats.name)
    const description = toNonEmptyString(stats.description)
    const category = toNonEmptyString(stats.category)
    const type = toNonEmptyString(stats.type)
    const actionType = toNonEmptyString(stats.actionType)

    if (name && bucket.displayName === bucket.slug) {
      bucket.displayName = name
    }

    if (name) bucket.searchParts.push(name)
    if (description) bucket.searchParts.push(description)
    if (category) bucket.categories.add(category)
    if (type) bucket.types.add(type)
    if (actionType) bucket.actionTypes.add(actionType)
  }

  return Object.fromEntries(
    Array.from(bySkill.entries()).map(([skillId, bucket]) => [
      skillId,
      {
        searchBlob: `${bucket.slug} ${bucket.searchParts.join(" ")}`.trim().toLowerCase(),
        displayName: bucket.displayName,
        filters: {
          categories: Array.from(bucket.categories),
          types: Array.from(bucket.types),
          actionTypes: Array.from(bucket.actionTypes),
          tags: Array.from(new Set(bucket.tags)),
        },
      },
    ]),
  )
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request)
  if (!userId) {
    return NextResponse.json({ message: "Usuario nao autenticado." }, { status: 401 })
  }

  try {
    const body = (await request.json()) as { skillIds?: unknown; rpgId?: unknown }
    const rawIds = Array.isArray(body.skillIds) ? body.skillIds : []
    const skillIds = Array.from(
      new Set(rawIds.filter((item): item is string => typeof item === "string" && item.length > 0)),
    )

    if (skillIds.length === 0) {
      return NextResponse.json({ index: {} }, { status: 200 })
    }

    const rpgId = typeof body.rpgId === "string" && body.rpgId.length > 0 ? body.rpgId : null
    const cacheKey = ["skills-search-index", userId, rpgId ?? "global", ...skillIds]
    const tags = buildSkillsIndexTagList({ userId, rpgId })
    const getCachedIndex = unstable_cache(
      async () => {
        const rows = await querySkillRows({ userId, skillIds, rpgId })
        return buildSearchIndex(rows)
      },
      cacheKey,
      {
        revalidate: 60,
        tags,
      },
    )
    let index: Record<string, unknown>
    try {
      index = await getCachedIndex()
    } catch {
      const rows = await querySkillRows({ userId, skillIds, rpgId })
      index = buildSearchIndex(rows)
    }

    return NextResponse.json({ index }, { status: 200 })
  } catch {
    return NextResponse.json({ message: "Erro interno ao montar indice de busca." }, { status: 500 })
  }
}
