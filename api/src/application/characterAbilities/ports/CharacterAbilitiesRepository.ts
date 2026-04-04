import type {
  CharacterAbilitiesCharacterRow,
  CharacterAbilitiesClassRow,
  CharacterAbilitiesPurchasedSkillLevelRow,
  CharacterAbilitiesSkillClassLinkRow,
  CharacterAbilitiesSkillRaceLinkRow,
} from "@/application/characterAbilities/types"

export interface CharacterAbilitiesRepository {
  getRpg(rpgId: string): Promise<{ id: string; ownerId: string; visibility: "private" | "public" } | null>
  getCharacter(rpgId: string, characterId: string): Promise<CharacterAbilitiesCharacterRow | null>
  getClassByKey(rpgId: string, classKey: string): Promise<CharacterAbilitiesClassRow | null>
  listPurchasedSkillLevels(
    rpgId: string,
    ownedSkillIds: string[],
  ): Promise<CharacterAbilitiesPurchasedSkillLevelRow[]>
  listSkillClassLinks(rpgId: string, ownedSkillIds: string[]): Promise<CharacterAbilitiesSkillClassLinkRow[]>
  listSkillRaceLinks(rpgId: string, ownedSkillIds: string[]): Promise<CharacterAbilitiesSkillRaceLinkRow[]>
}
