import type {
  MarkerSectionLinkGateway,
  MarkerSectionLinkMarker
} from "@/features/world/location/application/contracts/MarkerSectionLinkGateway"

export function setMarkerSectionLinkUseCase(
  gateway: MarkerSectionLinkGateway,
  params: {
    rpgId: string
    mapId: string
    sectionId: string | null
    marker: MarkerSectionLinkMarker
  }
) {
  return gateway.setLink(params)
}
