import type { CharacterAbilitiesParserService } from "@/features/world/character/application/abilities/ports/CharacterAbilitiesParserService"
import {
  parseCharacterAbilities,
  parseCostPoints,
} from "@/features/world/character/infrastructure/abilities/services/characterAbilityCostParser"

export const characterAbilitiesParserService: CharacterAbilitiesParserService =
  {
    parseCharacterAbilities,
    parseCostPoints,
  }
