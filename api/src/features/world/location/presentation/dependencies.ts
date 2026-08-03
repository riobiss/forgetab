import { prismaRpgMapRepository } from "@/features/world/location/infrastructure/repositories/prismaRpgMapRepository"
import { prismaMarkerSectionLinkRepository } from "@/features/world/location/infrastructure/repositories/prismaMarkerSectionLinkRepository"
import { prismaRpgMapMarkerRepository } from "@/features/world/location/infrastructure/repositories/prismaRpgMapMarkerRepository"
import { rpgMapAccessService } from "@/features/world/location/infrastructure/services/rpgMapAccessService"

export const rpgMapRouteDeps = {
  repository: prismaRpgMapRepository,
  markerSectionLinkRepository: prismaMarkerSectionLinkRepository,
  markerRepository: prismaRpgMapMarkerRepository,
  accessService: rpgMapAccessService,
} as const
