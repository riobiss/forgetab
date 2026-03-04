import type {
  CreateOrUpdateSkillPayloadDto,
  RpgSettingsDto,
  SkillDetailDto,
  SkillSearchIndexItemDto,
  SkillListItemDto,
  TemplateOptionDto,
  UpdateSkillLevelPayloadDto,
} from "@/application/skillsDashboard/types"

export interface SkillsDashboardGateway {
  fetchClasses(rpgId: string): Promise<TemplateOptionDto[]>
  fetchRaces(rpgId: string): Promise<TemplateOptionDto[]>
  fetchSkills(rpgId: string): Promise<SkillListItemDto[]>
  fetchSkillsSearchIndex(skillIds: string[]): Promise<Record<string, SkillSearchIndexItemDto>>
  fetchRpgSettings(rpgId: string): Promise<RpgSettingsDto>
  fetchSkillById(skillId: string): Promise<SkillDetailDto>
  createSkill(payload: CreateOrUpdateSkillPayloadDto): Promise<SkillDetailDto>
  updateSkillMeta(skillId: string, payload: CreateOrUpdateSkillPayloadDto): Promise<SkillDetailDto>
  createSkillLevelSnapshot(skillId: string): Promise<SkillDetailDto>
  updateSkillLevel(skillId: string, levelId: string, payload: UpdateSkillLevelPayloadDto): Promise<SkillDetailDto>
  deleteSkillLevel(skillId: string, levelId: string): Promise<SkillDetailDto>
  deleteSkill(skillId: string): Promise<{ id: string }>
}
