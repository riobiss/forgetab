import type { SkillsDashboardGateway } from "@/application/skillsDashboard/contracts/SkillsDashboardGateway"
import type {
  CreateOrUpdateSkillPayloadDto,
  RpgSettingsDto,
  SkillDetailDto,
  SkillSearchIndexItemDto,
  SkillListItemDto,
  TemplateOptionDto,
  UpdateSkillLevelPayloadDto,
} from "@/application/skillsDashboard/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpSkillsDashboardGateway: SkillsDashboardGateway = {
  async fetchClasses(rpgId: string): Promise<TemplateOptionDto[]> {
    const response = await fetch(`/api/rpg/${rpgId}/classes`)
    const payload = await parseJson<{ classes?: TemplateOptionDto[] }>(response)
    return payload.classes ?? []
  },

  async fetchRaces(rpgId: string): Promise<TemplateOptionDto[]> {
    const response = await fetch(`/api/rpg/${rpgId}/races`)
    const payload = await parseJson<{ races?: TemplateOptionDto[] }>(response)
    return payload.races ?? []
  },

  async fetchSkills(rpgId: string): Promise<SkillListItemDto[]> {
    const response = await fetch(`/api/skills?rpgId=${rpgId}`)
    const payload = await parseJson<{ skills?: SkillListItemDto[] }>(response)
    return payload.skills ?? []
  },

  async fetchSkillsSearchIndex(params: {
    skillIds: string[]
    rpgId?: string | null
  }): Promise<Record<string, SkillSearchIndexItemDto>> {
    if (params.skillIds.length === 0) return {}
    const response = await fetch("/api/skills/search-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillIds: params.skillIds, rpgId: params.rpgId }),
    })
    const payload = await parseJson<{ index?: Record<string, SkillSearchIndexItemDto> }>(response)
    return payload.index ?? {}
  },

  async fetchRpgSettings(rpgId: string): Promise<RpgSettingsDto> {
    const response = await fetch(`/api/rpg/${rpgId}`)
    const payload = await parseJson<{ rpg?: RpgSettingsDto }>(response)
    return payload.rpg ?? {}
  },

  async fetchSkillById(skillId: string): Promise<SkillDetailDto> {
    const response = await fetch(`/api/skills/${skillId}`)
    const payload = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!payload.skill) {
      throw new Error("Erro ao carregar skill.")
    }
    return payload.skill
  },

  async createSkill(payload: CreateOrUpdateSkillPayloadDto): Promise<SkillDetailDto> {
    const response = await fetch("/api/skills", {
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

  async updateSkillMeta(skillId: string, payload: CreateOrUpdateSkillPayloadDto): Promise<SkillDetailDto> {
    const response = await fetch(`/api/skills/${skillId}`, {
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
    const response = await fetch(`/api/skills/${skillId}/levels`, {
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
    const response = await fetch(`/api/skills/${skillId}/levels/${levelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao salvar level.")
    }
    return result.skill
  },

  async deleteSkillLevel(skillId: string, levelId: string): Promise<SkillDetailDto> {
    const response = await fetch(`/api/skills/${skillId}/levels/${levelId}`, {
      method: "DELETE",
    })
    const result = await parseJson<{ skill?: SkillDetailDto }>(response)
    if (!result.skill) {
      throw new Error("Erro ao remover level.")
    }
    return result.skill
  },

  async deleteSkill(skillId: string): Promise<{ id: string }> {
    const response = await fetch(`/api/skills/${skillId}`, {
      method: "DELETE",
    })
    const result = await parseJson<{ id?: string }>(response)
    if (!result.id) {
      throw new Error("Erro ao remover skill.")
    }
    return { id: result.id }
  },
}
