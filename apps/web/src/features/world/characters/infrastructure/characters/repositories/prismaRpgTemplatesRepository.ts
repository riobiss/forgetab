import type { RpgTemplatesRepository } from "@/features/world/characters/application/characters/ports/RpgTemplatesRepository"
import { prismaRpgTemplatesRepository as legacyPrismaRpgTemplatesRepository } from "@/lib/server/characters/repositories/rpgTemplatesRepository"

export const prismaRpgTemplatesRepository: RpgTemplatesRepository = legacyPrismaRpgTemplatesRepository
