import { prismaLibraryRepository } from "@/infrastructure/library/repositories/prismaLibraryRepository"
import { libraryAccessService } from "@/infrastructure/library/services/libraryAccessService"

export const libraryRouteDeps = {
  repository: prismaLibraryRepository,
  accessService: libraryAccessService,
} as const
