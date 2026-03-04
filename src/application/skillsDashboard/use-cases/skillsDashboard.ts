import type { SkillsDashboardDependencies } from "@/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import type {
  CreateOrUpdateSkillPayloadDto,
  SkillDetailDto,
  SkillListItemDto,
  UpdateSkillLevelPayloadDto,
} from "@/application/skillsDashboard/types"

type Dependencies = SkillsDashboardDependencies

export async function loadDashboardData(deps: Dependencies, params: { rpgId: string }) {
  const [classes, races, skills, rpgSettings] = await Promise.all([
    deps.gateway.fetchClasses(params.rpgId),
    deps.gateway.fetchRaces(params.rpgId),
    deps.gateway.fetchSkills(params.rpgId),
    deps.gateway.fetchRpgSettings(params.rpgId),
  ])

  return { classes, races, skills, rpgSettings }
}

export async function buildSkillsSearchIndex(
  deps: Dependencies,
  params: { skills: SkillListItemDto[] },
): Promise<
  Record<
    string,
    {
      searchBlob: string
      displayName: string
      filters: { categories: string[]; types: string[]; actionTypes: string[]; tags: string[] }
    }
  >
> {
  const entries = await Promise.all(
    params.skills.map(async (skill) => {
      try {
        const detail = await deps.gateway.fetchSkillById(skill.id)

        const displayName =
          detail.levels
            .map((level) => {
              const stats = (level.stats ?? {}) as Record<string, unknown>
              return typeof stats.name === "string" ? stats.name.trim() : ""
            })
            .find((name) => name.length > 0) ?? skill.slug

        const merged = detail.levels
          .map((level) => {
            const stats = (level.stats ?? {}) as Record<string, unknown>
            const name = typeof stats.name === "string" ? stats.name : ""
            const description = typeof stats.description === "string" ? stats.description : ""
            return `${name} ${description}`
          })
          .join(" ")
          .toLowerCase()

        const categories = Array.from(
          new Set(
            detail.levels
              .map((level) => {
                const stats = (level.stats ?? {}) as Record<string, unknown>
                return typeof stats.category === "string" ? stats.category.trim() : ""
              })
              .filter((item) => item.length > 0),
          ),
        )

        const types = Array.from(
          new Set(
            detail.levels
              .map((level) => {
                const stats = (level.stats ?? {}) as Record<string, unknown>
                return typeof stats.type === "string" ? stats.type.trim() : ""
              })
              .filter((item) => item.length > 0),
          ),
        )

        const actionTypes = Array.from(
          new Set(
            detail.levels
              .map((level) => {
                const stats = (level.stats ?? {}) as Record<string, unknown>
                return typeof stats.actionType === "string" ? stats.actionType.trim() : ""
              })
              .filter((item) => item.length > 0),
          ),
        )

        const tags = Array.isArray(detail.tags)
          ? Array.from(new Set(detail.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)))
          : []

        return {
          id: skill.id,
          searchBlob: `${skill.slug} ${merged}`.trim(),
          displayName,
          filters: { categories, types, actionTypes, tags },
        }
      } catch {
        return {
          id: skill.id,
          searchBlob: skill.slug.toLowerCase(),
          displayName: skill.slug,
          filters: { categories: [], types: [], actionTypes: [], tags: [] },
        }
      }
    }),
  )

  return Object.fromEntries(entries.map((entry) => [entry.id, {
    searchBlob: entry.searchBlob,
    displayName: entry.displayName,
    filters: entry.filters,
  }]))
}

export function parseSearchIndex(index: Awaited<ReturnType<typeof buildSkillsSearchIndex>>) {
  return {
    skillSearchIndex: Object.fromEntries(Object.entries(index).map(([id, item]) => [id, item.searchBlob])),
    skillDisplayNameById: Object.fromEntries(Object.entries(index).map(([id, item]) => [id, item.displayName])),
    skillFilterMetaById: Object.fromEntries(Object.entries(index).map(([id, item]) => [id, item.filters])),
  }
}

export async function loadSkillDetail(deps: Dependencies, params: { skillId: string }): Promise<SkillDetailDto> {
  return deps.gateway.fetchSkillById(params.skillId)
}

export async function createSkillUseCase(
  deps: Dependencies,
  params: { payload: CreateOrUpdateSkillPayloadDto },
): Promise<SkillDetailDto> {
  return deps.gateway.createSkill(params.payload)
}

export async function updateSkillMetaUseCase(
  deps: Dependencies,
  params: { skillId: string; payload: CreateOrUpdateSkillPayloadDto },
): Promise<SkillDetailDto> {
  return deps.gateway.updateSkillMeta(params.skillId, params.payload)
}

export async function createSkillLevelSnapshotUseCase(
  deps: Dependencies,
  params: { skillId: string },
): Promise<SkillDetailDto> {
  return deps.gateway.createSkillLevelSnapshot(params.skillId)
}

export async function updateSkillLevelUseCase(
  deps: Dependencies,
  params: { skillId: string; levelId: string; payload: UpdateSkillLevelPayloadDto },
): Promise<SkillDetailDto> {
  return deps.gateway.updateSkillLevel(params.skillId, params.levelId, params.payload)
}

export async function deleteSkillLevelUseCase(
  deps: Dependencies,
  params: { skillId: string; levelId: string },
): Promise<SkillDetailDto> {
  return deps.gateway.deleteSkillLevel(params.skillId, params.levelId)
}

export async function deleteSkillUseCase(
  deps: Dependencies,
  params: { skillId: string },
): Promise<{ id: string }> {
  return deps.gateway.deleteSkill(params.skillId)
}
