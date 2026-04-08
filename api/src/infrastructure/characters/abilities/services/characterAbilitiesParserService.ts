import type { CharacterAbilitiesParserService } from "@/application/characters/abilities/ports/CharacterAbilitiesParserService"
import {
  parseCharacterAbilities,
  parseCostPoints,
} from "@/infrastructure/characters/abilities/services/characterAbilityCostParser"

export const characterAbilitiesParserService: CharacterAbilitiesParserService = {
  parseCharacterAbilities,
  parseCostPoints,
}
