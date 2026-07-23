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
} from "@/features/world/character/application/types"

export type RouteContext = {
  params: Promise<{
    rpgId: string
  }>
}
