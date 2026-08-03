import type { SkillsDashboardGateway } from "@/features/world/skills/application/skillsDashboard/contracts/SkillsDashboardGateway"
import type {
  CreateOrUpdateSkillPayloadDto,
  RpgSettingsDto,
  SkillDetailDto,
  SkillSearchIndexItemDto,
  SkillListItemDto,
  TemplateOptionDto,
  UpdateSkillLevelPayloadDto,
} from "@/features/world/skills/application/skillsDashboard/types"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse as parseJson } from "@/features/http/infrastructure/parseApiResponse"

function skillPath(skillId?: string) {
  return skillId
    ? `/api/skills/${encodeURIComponent(skillId)}`
    : "/api/skills"
}

function skillLevelPath(skillId: string, levelId?: string) {
  const basePath = `${skillPath(skillId)}/levels`
  return levelId ? `${basePath}/${encodeURIComponent(levelId)}` : basePath
}

export const httpSkillsDashboardGateway: SkillsDashboardGateway = {
  async fetchClasses(rpgId: string): Promise<TemplateOptionDto[]> {
    const response = await apiFetch(
      `/api/rpg/${encodeURIComponent(rpgId)}/classes`,
    )
    const payload = await parseJson<{ classes?: TemplateOptionDto[] }>(response)
    return payload.classes ?? []
  },

  async fetchRaces(rpgId: string): Promise<TemplateOptionDto[]> {
    const response = await apiFetch(
      `/api/rpg/${encodeURIComponent(rpgId)}/races`,
    )
    const payload = await parseJson<{ races?: TemplateOptionDto[] }>(response)
    return payload.races ?? []
  },

  async fetchSkills(rpgId: string): Promise<SkillListItemDto[]> {
    const response = await apiFetch(
      `${skillPath()}?rpgId=${encodeURIComponent(rpgId)}`,
    )
    const payload = await parseJson<{ skills?: SkillListItemDto[] }>(response)
    return payload.skills ?? []
  },

  async fetchSkillsSearchIndex(params: {
    skillIds: string[]
    rpgId?: string | null
  }): Promise<Record<string, SkillSearchIndexItemDto>> {
    if (params.skillIds.length === 0) return {}
    const response = await apiFetch("/api/skills/search-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillIds: params.skillIds, rpgId: params.rpgId }),
    })
    const payload = await parseJson<{
      index?: Record<string, SkillSearchIndexItemDto>
    }>(response)
    return payload.index ?? {}
  },

  async fetchRpgSettings(rpgId: string): Promise<RpgSettingsDto> {
    const response = await apiFetch(`/api/rpg/${encodeURIComponent(rpgId)}`)
    const payload = await parseJson<{ rpg?: RpgSettingsDto }>(response)
    return payload.rpg ?? {}
  },

  async fetchSkillById(skillId: string): Promise<SkillDetailDto> {
    const response = await apiFetch(skillPath(skillId))
    const payload = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!payload.skill) {
      throw new Error("Erro ao carregar skill.")
    }
    return payload.skill
  },

  async createSkill(
    payload: CreateOrUpdateSkillPayloadDto,
  ): Promise<SkillDetailDto> {
    const response = await apiFetch(skillPath(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao criar habilidade.")
    }
    return result.skill
  },

  async updateSkillMeta(
    skillId: string,
    payload: CreateOrUpdateSkillPayloadDto,
  ): Promise<SkillDetailDto> {
    const response = await apiFetch(skillPath(skillId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao salvar meta.")
    }
    return result.skill
  },

  async createSkillLevelSnapshot(skillId: string): Promise<SkillDetailDto> {
    const response = await apiFetch(skillLevelPath(skillId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao criar level.")
    }
    return result.skill
  },

  async updateSkillLevel(
    skillId: string,
    levelId: string,
    payload: UpdateSkillLevelPayloadDto,
  ): Promise<SkillDetailDto> {
    const response = await apiFetch(
      skillLevelPath(skillId, levelId),
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    )
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao salvar level.")
    }
    return result.skill
  },

  async deleteSkillLevel(
    skillId: string,
    levelId: string,
  ): Promise<SkillDetailDto> {
    const response = await apiFetch(
      skillLevelPath(skillId, levelId),
      {
        method: "DELETE",
      },
    )
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao remover level.")
    }
    return result.skill
  },

  async deleteSkill(skillId: string): Promise<{ id: string }> {
    const response = await apiFetch(skillPath(skillId), {
      method: "DELETE",
    })
    const result = await parseJson<{ id?: string }>(response)
    if (!result.id) {
      throw new Error("Erro ao remover skill.")
    }
    return { id: result.id }
  },
}
