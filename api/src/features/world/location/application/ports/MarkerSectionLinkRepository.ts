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

export type SetMarkerSectionLinkResult =
  | { status: "linked"; sectionId: string }
  | { status: "unlinked"; sectionId: null }
  | { status: "marker_not_found" }
  | { status: "section_not_found" }

export interface MarkerSectionLinkRepository {
  setLink(params: {
    rpgId: string
    mapId: string
    sectionId: string | null
    marker: MarkerSectionLinkMarker
  }): Promise<SetMarkerSectionLinkResult>
}
