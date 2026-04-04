import type {
  AttributeTemplateRow,
  CharacterCharacteristicTemplateRow,
  CharacterIdentityTemplateRow,
  IdentityTemplateRow,
  SkillTemplateRow,
  StatusTemplateRow,
} from "@/application/characters/types"

export interface RpgTemplatesRepository {
  getAttributeTemplates(rpgId: string): Promise<AttributeTemplateRow[]>
  getStatusTemplates(rpgId: string): Promise<StatusTemplateRow[]>
  getSkillTemplates(rpgId: string): Promise<SkillTemplateRow[]>
  getIdentityTemplates(rpgId: string): Promise<CharacterIdentityTemplateRow[]>
  getCharacteristicTemplates(rpgId: string): Promise<CharacterCharacteristicTemplateRow[]>
  getRaceTemplates(rpgId: string): Promise<IdentityTemplateRow[]>
  getClassTemplates(rpgId: string): Promise<IdentityTemplateRow[]>
}
