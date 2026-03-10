import type {
  AttributeTemplate,
  CharacteristicTemplate,
  ClassTemplate,
  IdentityTemplate,
  RaceTemplate,
  StatusTemplate,
} from "@/application/rpgConfig/types"
import type { EntityCatalogMeta } from "@/domain/entityCatalog/types"

export interface RpgConfigRepository {
  listAttributeTemplates(rpgId: string): Promise<AttributeTemplate[]>
  replaceAttributeTemplates(
    rpgId: string,
    items: Array<{ key: string; label: string }>,
  ): Promise<void>

  listStatusTemplates(rpgId: string): Promise<StatusTemplate[]>
  replaceStatusTemplates(
    rpgId: string,
    items: Array<{ key: string; label: string }>,
  ): Promise<void>

  listRaceTemplates(rpgId: string): Promise<RaceTemplate[]>
  replaceRaceTemplates(
    rpgId: string,
    items: Array<{
      key: string
      label: string
      category: string
      attributeBonuses: Record<string, number>
      skillBonuses: Record<string, number>
      lore: unknown
      catalogMeta: EntityCatalogMeta
    }>,
  ): Promise<void>

  listClassTemplates(rpgId: string): Promise<ClassTemplate[]>
  replaceClassTemplates(
    rpgId: string,
    items: Array<{
      key: string
      label: string
      category: string
      attributeBonuses: Record<string, number>
      skillBonuses: Record<string, number>
      catalogMeta: EntityCatalogMeta
    }>,
  ): Promise<void>

  listIdentityTemplates(rpgId: string): Promise<IdentityTemplate[]>
  replaceIdentityTemplates(
    rpgId: string,
    items: Array<{ key: string; label: string; required: boolean }>,
  ): Promise<void>

  listCharacteristicTemplates(rpgId: string): Promise<CharacteristicTemplate[]>
  replaceCharacteristicTemplates(
    rpgId: string,
    items: Array<{ key: string; label: string; required: boolean }>,
  ): Promise<void>

  listAttributeKeys(rpgId: string): Promise<string[]>
  listSkillKeys(rpgId: string): Promise<string[]>
}
