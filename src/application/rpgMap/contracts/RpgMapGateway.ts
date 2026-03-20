export interface RpgMapGateway {
  fetchMaps(rpgId: string): Promise<{ maps: import("@/application/rpgMap/types").RpgMapDto[]; canManage: boolean }>
  fetchMap(rpgId: string, mapId: string): Promise<import("@/application/rpgMap/types").RpgMapDetailViewDto>
  createMap(rpgId: string, payload: import("@/application/rpgMap/types").UpsertRpgMapPayloadDto): Promise<import("@/application/rpgMap/types").RpgMapDto>
  updateMap(rpgId: string, mapId: string, payload: import("@/application/rpgMap/types").UpsertRpgMapPayloadDto): Promise<import("@/application/rpgMap/types").RpgMapDto>
  deleteMap(rpgId: string, mapId: string): Promise<void>
  createSection(
    rpgId: string,
    mapId: string,
    payload: import("@/application/rpgMap/types").UpsertRpgMapSectionPayloadDto,
  ): Promise<import("@/application/rpgMap/types").RpgMapSectionDto>
  updateSection(
    rpgId: string,
    mapId: string,
    sectionId: string,
    payload: import("@/application/rpgMap/types").UpsertRpgMapSectionPayloadDto,
  ): Promise<import("@/application/rpgMap/types").RpgMapSectionDto>
  deleteSection(rpgId: string, mapId: string, sectionId: string): Promise<void>
  reorderSection(
    rpgId: string,
    mapId: string,
    sectionId: string,
    direction: "up" | "down",
  ): Promise<import("@/application/rpgMap/types").RpgMapSectionDto>
  createMarkerGroup(
    rpgId: string,
    mapId: string,
    payload: import("@/application/rpgMap/types").UpsertRpgMapMarkerGroupPayloadDto,
  ): Promise<import("@/application/rpgMap/types").RpgMapMarkerGroupDto>
  updateMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string,
    payload: import("@/application/rpgMap/types").UpsertRpgMapMarkerGroupPayloadDto,
  ): Promise<import("@/application/rpgMap/types").RpgMapMarkerGroupDto>
  deleteMarkerGroup(rpgId: string, mapId: string, groupId: string): Promise<void>
  saveMapImage(
    rpgId: string,
    mapId: string,
    mapImage: string | null,
  ): Promise<{ message?: string; mapImage: string | null }>
  uploadMapImage(file: File, oldUrl?: string | null): Promise<{ url: string; message?: string }>
  deleteMapImage(url: string): Promise<{ message?: string }>
}
