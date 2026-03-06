import type { RpgTemplatesRepository } from "@/application/characters/ports/RpgTemplatesRepository"
import { prismaRpgTemplatesRepository as legacyPrismaRpgTemplatesRepository } from "@/lib/server/characters/repositories/rpgTemplatesRepository"

export const prismaRpgTemplatesRepository: RpgTemplatesRepository = legacyPrismaRpgTemplatesRepository
