import type {
  CharacterDetailClassLabelDto,
  CharacterDetailLabelDto,
  CharacterDetailRowDto,
  CharacterDetailRpgDto,
  CharacterDetailTemplateFieldDto,
} from "@/application/charactersDetail/types"

export interface CharacterDetailRepository {
  getRpg(rpgId: string): Promise<CharacterDetailRpgDto | null>
  getCharacter(rpgId: string, characterId: string): Promise<CharacterDetailRowDto | null>
  listSkillLabels(rpgId: string): Promise<CharacterDetailLabelDto[]>
  listStatusLabels(rpgId: string): Promise<CharacterDetailLabelDto[]>
  listIdentityFields(rpgId: string): Promise<CharacterDetailTemplateFieldDto[]>
  listCharacteristicFields(rpgId: string): Promise<CharacterDetailTemplateFieldDto[]>
  listAttributeLabels(rpgId: string): Promise<CharacterDetailLabelDto[]>
  listRaceLabels(rpgId: string): Promise<CharacterDetailLabelDto[]>
  listClassLabels(rpgId: string): Promise<CharacterDetailClassLabelDto[]>
}
