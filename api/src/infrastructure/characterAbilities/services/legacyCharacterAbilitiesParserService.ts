import type { CharacterAbilitiesParserService } from "@/application/characters/abilities/ports/CharacterAbilitiesParserService"
import { parseCharacterAbilities, parseCostPoints } from "@/lib/server/costSystem"

export const legacyCharacterAbilitiesParserService: CharacterAbilitiesParserService = {
  parseCharacterAbilities,
  parseCostPoints,
}
