export type MarkerSectionLinkMarker = {
  id: string
  groupId: string
  visibility: "private" | "public"
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
}

export interface MarkerSectionLinkGateway {
  setLink(params: {
    rpgId: string
    mapId: string
    sectionId: string | null
    marker: MarkerSectionLinkMarker
  }): Promise<{ markerId: string; sectionId: string | null }>
}
