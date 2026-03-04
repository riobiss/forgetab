import type { SkillsDashboardDependencies } from "@/application/skillsDashboard/contracts/SkillsDashboardDependencies"
import type {
  CreateOrUpdateSkillPayloadDto,
  SkillDetailDto,
  SkillSearchIndexItemDto,
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
  Record<string, SkillSearchIndexItemDto>
> {
  const skillIds = params.skills.map((skill) => skill.id)
  const fetchedIndex = await deps.gateway.fetchSkillsSearchIndex(skillIds)

  return Object.fromEntries(
    params.skills.map((skill) => [
      skill.id,
      fetchedIndex[skill.id] ?? {
        searchBlob: skill.slug.toLowerCase(),
        displayName: skill.slug,
        filters: { categories: [], types: [], actionTypes: [], tags: [] },
      },
    ]),
  )
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
