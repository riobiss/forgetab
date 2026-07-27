export interface RpgMapGateway {
  fetchMaps(rpgId: string): Promise<{
    maps: import("@/features/world/location/application/types").RpgMapDto[]
    canManage: boolean
  }>
  fetchMap(
    rpgId: string,
    mapId: string,
  ): Promise<
    import("@/features/world/location/application/types").RpgMapDetailViewDto
  >
  createMap(
    rpgId: string,
    payload: import("@/features/world/location/application/types").UpsertRpgMapPayloadDto,
  ): Promise<import("@/features/world/location/application/types").RpgMapDto>
  updateMap(
    rpgId: string,
    mapId: string,
    payload: import("@/features/world/location/application/types").UpsertRpgMapPayloadDto,
  ): Promise<import("@/features/world/location/application/types").RpgMapDto>
  deleteMap(rpgId: string, mapId: string): Promise<void>
  createSection(
    rpgId: string,
    mapId: string,
    payload: import("@/features/world/location/application/types").UpsertRpgMapSectionPayloadDto,
  ): Promise<
    import("@/features/world/location/application/types").RpgMapSectionDto
  >
  updateSection(
    rpgId: string,
    mapId: string,
    sectionId: string,
    payload: import("@/features/world/location/application/types").UpsertRpgMapSectionPayloadDto,
  ): Promise<
    import("@/features/world/location/application/types").RpgMapSectionDto
  >
  deleteSection(rpgId: string, mapId: string, sectionId: string): Promise<void>
  reorderSection(
    rpgId: string,
    mapId: string,
    sectionId: string,
    direction: "up" | "down",
  ): Promise<
    import("@/features/world/location/application/types").RpgMapSectionDto
  >
  createMarkerGroup(
    rpgId: string,
    mapId: string,
    payload: import("@/features/world/location/application/types").UpsertRpgMapMarkerGroupPayloadDto,
  ): Promise<
    import("@/features/world/location/application/types").RpgMapMarkerGroupDto
  >
  updateMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string,
    payload: import("@/features/world/location/application/types").UpsertRpgMapMarkerGroupPayloadDto,
  ): Promise<
    import("@/features/world/location/application/types").RpgMapMarkerGroupDto
  >
  deleteMarkerGroup(
    rpgId: string,
    mapId: string,
    groupId: string,
  ): Promise<void>
  saveMapImage(
    rpgId: string,
    mapId: string,
    mapImage: string | null,
  ): Promise<{ message?: string; mapImage: string | null }>
  uploadMapImage(
    file: File,
    oldUrl?: string | null,
  ): Promise<{ url: string; message?: string }>
  deleteMapImage(url: string): Promise<{ message?: string }>
  uploadSectionImage(
    file: File,
    oldUrl?: string | null,
  ): Promise<{ url: string; message?: string }>
  deleteSectionImage(url: string): Promise<{ message?: string }>
  uploadMarkerImage(
    file: File,
    oldUrl?: string | null,
  ): Promise<{ url: string; message?: string }>
  deleteMarkerImage(url: string): Promise<{ message?: string }>
}
