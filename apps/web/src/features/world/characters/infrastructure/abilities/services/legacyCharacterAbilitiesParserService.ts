import type { CharacterAbilitiesParserService } from "@/features/world/characters/application/abilities/ports/CharacterAbilitiesParserService"
import {
  parseCharacterAbilities,
  parseCostPoints,
} from "@/lib/server/costSystem"

export const legacyCharacterAbilitiesParserService: CharacterAbilitiesParserService =
  {
    parseCharacterAbilities,
    parseCostPoints,
  }
