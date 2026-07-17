import type { CharacterRepository } from "@/features/world/characters/application/characters/ports/CharacterRepository"
import { prismaCharacterRepository as legacyPrismaCharacterRepository } from "@/lib/server/characters/repositories/characterRepository"

export const prismaCharacterRepository: CharacterRepository = legacyPrismaCharacterRepository
