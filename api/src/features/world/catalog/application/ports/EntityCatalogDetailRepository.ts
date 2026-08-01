import type { CatalogEntityType } from "@/features/world/catalog/domain/types"
import type {
  EntityCatalogCurrentDetail,
  EntityCatalogTemplateOption,
} from "@/features/world/catalog/application/types"

export type EntityCatalogDetailSnapshot = {
  entityType: CatalogEntityType
  id: string
  key: string
  ownerId: string
  visibility: "private" | "public"
  costsEnabled: boolean
  costResourceName: string
  current: EntityCatalogCurrentDetail
}

export interface EntityCatalogDetailRepository {
  getClassDetail(params: {
    rpgId: string
    classId: string
  }): Promise<EntityCatalogDetailSnapshot | null>
  getRaceDetail(params: {
    rpgId: string
    raceKey: string
  }): Promise<EntityCatalogDetailSnapshot | null>
  listAttributeTemplates(rpgId: string): Promise<EntityCatalogTemplateOption[]>
  listSkillTemplates(rpgId: string): Promise<EntityCatalogTemplateOption[]>
}
