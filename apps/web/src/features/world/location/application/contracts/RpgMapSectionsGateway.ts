import type {
  RpgMapSectionDto,
  UpsertRpgMapSectionPayloadDto
} from "@forgetab/world-contracts/location"

export interface RpgMapSectionsGateway {
  createSection(
    rpgId: string,
    mapId: string,
    payload: UpsertRpgMapSectionPayloadDto
  ): Promise<RpgMapSectionDto>
  updateSection(
    rpgId: string,
    mapId: string,
    sectionId: string,
    payload: UpsertRpgMapSectionPayloadDto
  ): Promise<RpgMapSectionDto>
  deleteSection(rpgId: string, mapId: string, sectionId: string): Promise<void>
  reorderSection(
    rpgId: string,
    mapId: string,
    sectionId: string,
    direction: "up" | "down"
  ): Promise<RpgMapSectionDto>
}
