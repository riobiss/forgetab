import type { RpgMapRepository } from "@/features/world/location/application/ports/RpgMapRepository.js"
import { prismaRpgMapMarkerStore } from "./prismaRpgMapMarkerStore.js"
import { prismaRpgMapSectionStore } from "./prismaRpgMapSectionStore.js"
import { prismaRpgMapStore } from "./prismaRpgMapStore.js"

export const prismaRpgMapRepository: RpgMapRepository = {
  ...prismaRpgMapStore,
  ...prismaRpgMapSectionStore,
  ...prismaRpgMapMarkerStore
}
