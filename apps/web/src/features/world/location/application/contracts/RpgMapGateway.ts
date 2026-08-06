import type { RpgMapImagesGateway } from "./RpgMapImagesGateway"
import type { RpgMapMarkerGroupsGateway } from "./RpgMapMarkerGroupsGateway"
import type { RpgMapSectionsGateway } from "./RpgMapSectionsGateway"
import type { RpgMapsGateway } from "./RpgMapsGateway"

export interface RpgMapGateway
  extends
    RpgMapsGateway,
    RpgMapSectionsGateway,
    RpgMapMarkerGroupsGateway,
    RpgMapImagesGateway {}
