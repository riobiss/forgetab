export type UpdateRpgMapMarkerInput = {
  rpgId: string
  mapId: string
  groupId: string
  markerId: string
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
}

export interface RpgMapMarkerRepository {
  updateMarker(params: UpdateRpgMapMarkerInput): Promise<boolean>
}
