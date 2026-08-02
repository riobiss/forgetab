import type { ActionType, SkillCategory, SkillTag, SkillType } from "@/types/skillBuilder"
import type {
  SkillDetailDto,
  SkillLevelDto,
  SkillListItemDto,
  TemplateOptionDto,
} from "@/features/world/skills/application/skillsDashboard/types"

export type OwnedRpg = { id: string; title: string }
export type TemplateOption = TemplateOptionDto
export type SkillListItem = SkillListItemDto
export type SkillLevel = SkillLevelDto
export type SkillDetail = SkillDetailDto

export type MetaForm = {
  name: string
  category: SkillCategory | ""
  type: SkillType | ""
  actionType: ActionType | ""
  tags: SkillTag[]
  description: string
  classIds: string[]
  raceIds: string[]
}

export type LevelForm = {
  levelName: string
  levelDescription: string
  notesList: string[]
  levelRequired: string
  summary: string
  damage: string
  cooldown: string
  range: string
  duration: string
  castTime: string
  resourceCost: string
  costPoints: string
  costCustom: string
  prerequisite: string
  levelCategory: SkillCategory | ""
  levelType: SkillType | ""
  levelActionType: ActionType | ""
  customFields: { id: string; name: string; value: string }[]
}

export type SkillsDashboardProps = {
  ownedRpgs: OwnedRpg[]
  initialRpgId?: string
  hideRpgSelector?: boolean
  title?: string
}
