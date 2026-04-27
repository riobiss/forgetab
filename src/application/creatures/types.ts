import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto,
} from "@/application/characters/editor"

export type CreatureTemplateFieldDto = {
  id: string
  key: string
  label: string
  fieldType: "text" | "number"
  position: number
}

export type CreatureTemplateCategoryDto = {
  id: string
  key: string
  label: string
  position: number
  fields: CreatureTemplateFieldDto[]
}

export type CreatureEditorBootstrapDto = CharacterEditorBootstrapDto
export type CreatureSummaryDto = CharacterEditorSummaryDto
export type CreateCreaturePayloadDto = UpsertCharacterPayloadDto
export type UpdateCreaturePayloadDto = UpdateCharacterPayloadDto
