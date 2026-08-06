import { prismaLibraryRepository } from "@/features/world/library/infrastructure/repositories/prismaLibraryRepository"
import { libraryAccessService } from "@/features/world/library/infrastructure/services/libraryAccessService"

export const libraryRouteDeps = {
  repository: prismaLibraryRepository,
  accessService: libraryAccessService
} as const
