import type {
  SkillSearchIndexEntry,
  SkillSearchIndexRow,
} from "@/application/skillsSearchIndex/types"
import type { SkillsSearchIndexRepository } from "@/application/skillsSearchIndex/ports/SkillsSearchIndexRepository"

function normalizeStats(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }
  return value as Record<string, unknown>
}

function toNonEmptyString(value: unknown): string {
  if (typeof value !== "string") return ""
  return value.trim()
}

export function normalizeSkillSearchIndexParams(body: {
  skillIds?: unknown
  rpgId?: unknown
}) {
  const rawIds = Array.isArray(body.skillIds) ? body.skillIds : []
  const skillIds = Array.from(
    new Set(
      rawIds.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      ),
    ),
  )

  const rpgId =
    typeof body.rpgId === "string" && body.rpgId.length > 0 ? body.rpgId : null

  return { skillIds, rpgId }
}

export function buildSkillSearchIndex(rows: SkillSearchIndexRow[]) {
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
        tags: (row.tags ?? [])
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
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
    Array.from(bySkill.entries()).map(
      ([skillId, bucket]): [string, SkillSearchIndexEntry] => [
        skillId,
        {
          searchBlob: `${bucket.slug} ${bucket.searchParts.join(" ")}`
            .trim()
            .toLowerCase(),
          displayName: bucket.displayName,
          filters: {
            categories: Array.from(bucket.categories),
            types: Array.from(bucket.types),
            actionTypes: Array.from(bucket.actionTypes),
            tags: Array.from(new Set(bucket.tags)),
          },
        },
      ],
    ),
  )
}

export async function loadSkillsSearchIndexUseCase(
  deps: { repository: SkillsSearchIndexRepository },
  params: {
    userId: string
    skillIds: string[]
    rpgId?: string | null
  },
) {
  if (params.skillIds.length === 0) {
    return {}
  }

  const rows = await deps.repository.listSkillRows(params)
  return buildSkillSearchIndex(rows)
}
