export type {
  CharacterRow,
  AttributeTemplateRow,
  StatusTemplateRow,
  SkillTemplateRow,
  CharacterIdentityTemplateRow,
  CharacterCharacteristicTemplateRow,
  IdentityTemplateRow,
  RpgAccess,
  CreateCharacterPayload,
  ListCharactersResult,
} from "@/application/characters/types"

export type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}
