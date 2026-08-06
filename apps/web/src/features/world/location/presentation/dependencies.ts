import { httpMarkerSectionLinkGateway } from "@/features/world/location/infrastructure/gateways/httpMarkerSectionLinkGateway"
import { httpPublicMarkerSectionSyncGateway } from "@/features/world/location/infrastructure/gateways/httpPublicMarkerSectionSyncGateway"
import { localPrivateMarkerSectionSyncGateway } from "@/features/world/location/infrastructure/gateways/localPrivateMarkerSectionSyncGateway"
import { httpRpgMapGateway } from "@/features/world/location/infrastructure/gateways/httpRpgMapGateway"
import { localPrivateMarkerGroupStorage } from "@/features/world/location/infrastructure/storage/localPrivateMarkerGroupStorage"

export const rpgMapPresentationDeps = {
  rpgMapGateway: httpRpgMapGateway,
  privateMarkerGroupStorage: localPrivateMarkerGroupStorage,
  markerSectionLinkGateway: httpMarkerSectionLinkGateway,
  markerSectionSyncGateways: {
    privateMarkers: localPrivateMarkerSectionSyncGateway,
    publicMarkers: httpPublicMarkerSectionSyncGateway
  }
} as const
