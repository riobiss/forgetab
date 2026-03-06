import type { CharacterRepository } from "@/application/characters/ports/CharacterRepository"
import { prismaCharacterRepository as legacyPrismaCharacterRepository } from "@/lib/server/characters/repositories/characterRepository"

export const prismaCharacterRepository: CharacterRepository = legacyPrismaCharacterRepository
