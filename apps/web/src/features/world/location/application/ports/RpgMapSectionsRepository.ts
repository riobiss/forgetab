import type { RpgMapSectionDto } from "@/features/world/location/application/types"

export interface RpgMapSectionsRepository {
  listSections(rpgId: string, mapId: string): Promise<RpgMapSectionDto[]>
  findSection(params: {
    rpgId: string
    mapId: string
    sectionId: string
  }): Promise<RpgMapSectionDto | null>
  createSection(params: {
    rpgId: string
    mapId: string
    userId: string
    parentSectionId: string | null
    name: string
    description: string | null
    type: string | null
    customFields: Record<string, unknown> | null
  }): Promise<RpgMapSectionDto>
  updateSection(params: {
    rpgId: string
    mapId: string
    sectionId: string
    parentSectionId: string | null
    name: string
    description: string | null
    type: string | null
    customFields: Record<string, unknown> | null
  }): Promise<RpgMapSectionDto | null>
  deleteSection(params: {
    rpgId: string
    mapId: string
    sectionId: string
  }): Promise<boolean>
  findSectionOwner(params: {
    rpgId: string
    mapId: string
    sectionId: string
  }): Promise<{ createdByUserId: string | null } | null>
  findAdjacentSection(params: {
    rpgId: string
    mapId: string
    parentSectionId: string | null
    sectionId: string
    direction: "up" | "down"
  }): Promise<RpgMapSectionDto | null>
  swapSectionOrder(params: {
    rpgId: string
    mapId: string
    sectionId: string
    otherSectionId: string
  }): Promise<void>
}
