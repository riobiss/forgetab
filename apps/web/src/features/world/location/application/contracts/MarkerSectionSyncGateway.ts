export type MarkerSectionSyncUpdate = {
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
}

export interface MarkerSectionSyncGateway {
  update(params: {
    rpgId: string
    mapId: string
    groupId: string
    markerId: string
    update: MarkerSectionSyncUpdate
  }): Promise<void>
}
