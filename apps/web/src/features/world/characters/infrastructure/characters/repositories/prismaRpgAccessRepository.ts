import type { RpgAccessRepository } from "@/features/world/characters/application/characters/ports/RpgAccessRepository"
import { prismaRpgAccessRepository as legacyPrismaRpgAccessRepository } from "@/lib/server/characters/repositories/rpgAccessRepository"

export const prismaRpgAccessRepository: RpgAccessRepository = legacyPrismaRpgAccessRepository
