import type { JsonMapValue } from "@forgetab/world-contracts/location"
import type { MarkerSectionSyncGateway } from "@/features/world/location/application/contracts/MarkerSectionSyncGateway"
import { buildMarkerUpdateFromSection } from "@/features/world/location/application/services/sectionMarkerFields"

type SyncMarker = {
  id: string
  groupId: string
  visibility: "private" | "public"
  name: string
  location: string | null
  shortDescription: string | null
  image: string | null
  color: string | null
}

export async function syncLinkedMarkerWithSectionUseCase(
  gateways: {
    privateMarkers: MarkerSectionSyncGateway
    publicMarkers: MarkerSectionSyncGateway
  },
  params: {
    rpgId: string
    mapId: string
    linkedMarker: SyncMarker
    section: {
      name: string
      description: string | null
      customFields: JsonMapValue | null
    }
  }
) {
  const gateway =
    params.linkedMarker.visibility === "private"
      ? gateways.privateMarkers
      : gateways.publicMarkers

  await gateway.update({
    rpgId: params.rpgId,
    mapId: params.mapId,
    groupId: params.linkedMarker.groupId,
    markerId: params.linkedMarker.id,
    update: buildMarkerUpdateFromSection({
      section: params.section,
      marker: params.linkedMarker
    })
  })
}
