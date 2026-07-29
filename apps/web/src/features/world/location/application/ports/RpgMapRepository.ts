import type { RpgMapMarkerGroupsRepository } from "./RpgMapMarkerGroupsRepository"
import type { RpgMapSectionsRepository } from "./RpgMapSectionsRepository"
import type { RpgMapsRepository } from "./RpgMapsRepository"

export interface RpgMapRepository
  extends RpgMapsRepository,
    RpgMapSectionsRepository,
    RpgMapMarkerGroupsRepository {}
