import { prismaLibraryRepository } from "@/infrastructure/library/repositories/prismaLibraryRepository"
import { legacyLibraryAccessService } from "@/infrastructure/library/services/legacyLibraryAccessService"

export const libraryRouteDeps = {
  repository: prismaLibraryRepository,
  accessService: legacyLibraryAccessService,
} as const
