import { prismaRpgMapRepository } from "@/features/world/infrastructure/map/repositories/prismaRpgMapRepository"
import { prismaMarkerSectionLinkRepository } from "@/features/world/infrastructure/map/repositories/prismaMarkerSectionLinkRepository"
import { prismaRpgMapMarkerRepository } from "@/features/world/infrastructure/map/repositories/prismaRpgMapMarkerRepository"
import { rpgMapAccessService } from "@/features/world/infrastructure/map/services/rpgMapAccessService"

export const rpgMapRouteDeps = {
  repository: prismaRpgMapRepository,
  markerSectionLinkRepository: prismaMarkerSectionLinkRepository,
  markerRepository: prismaRpgMapMarkerRepository,
  accessService: rpgMapAccessService,
} as const
