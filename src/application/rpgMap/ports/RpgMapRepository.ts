import type { RpgMapDto, RpgMapSectionDto } from "@/application/rpgMap/types"

export interface RpgMapRepository {
  listMaps(rpgId: string): Promise<RpgMapDto[]>
  findMap(rpgId: string, mapId: string): Promise<RpgMapDto | null>
  createMap(params: {
    rpgId: string
    userId: string
    title: string
    description: string | null
    type: string | null
    image: string | null
  }): Promise<RpgMapDto>
  updateMap(params: {
    rpgId: string
    mapId: string
    title: string
    description: string | null
    type: string | null
    image: string | null
  }): Promise<RpgMapDto | null>
  deleteMap(rpgId: string, mapId: string): Promise<boolean>
  findMapOwner(params: { rpgId: string; mapId: string }): Promise<{ createdByUserId: string | null } | null>
  listSections(rpgId: string, mapId: string): Promise<RpgMapSectionDto[]>
  findSection(params: { rpgId: string; mapId: string; sectionId: string }): Promise<RpgMapSectionDto | null>
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
  deleteSection(params: { rpgId: string; mapId: string; sectionId: string }): Promise<boolean>
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
