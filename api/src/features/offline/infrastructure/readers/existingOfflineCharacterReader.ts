import type { OfflineCharacterReader } from "@/features/offline/application/ports/OfflineCharacterReader"
import { loadCharacterAbilitiesUseCase } from "@/features/world/character/application/abilities/use-cases/characterAbilities"
import { loadCharacterDetailUseCase } from "@/features/world/character/application/detail/use-cases/loadCharacterDetail"
import { getCharacterInventoryUseCase } from "@/features/world/character/application/inventory/use-cases/manageCharacterInventory"
import type { CharacterAbilitiesRepository } from "@/features/world/character/application/abilities/ports/CharacterAbilitiesRepository"
import type { CharacterAbilitiesParserService } from "@/features/world/character/application/abilities/ports/CharacterAbilitiesParserService"
import type { CharacterDetailPermissionService } from "@/features/world/character/application/detail/ports/CharacterDetailPermissionService"
import type { CharacterDetailRepository } from "@/features/world/character/application/detail/ports/CharacterDetailRepository"
import type { CharacterInventoryRepository } from "@/features/world/character/application/inventory/ports/CharacterInventoryRepository"
import type { RpgAccessRepository } from "@/features/world/character/application/ports/RpgAccessRepository"

type Dependencies = {
  abilitiesRepository: CharacterAbilitiesRepository
  abilitiesParserService: CharacterAbilitiesParserService
  characterDetailRepository: CharacterDetailRepository
  characterDetailPermissionService: CharacterDetailPermissionService
  characterInventoryRepository: CharacterInventoryRepository
  rpgAccessRepository: RpgAccessRepository
}

export function createExistingOfflineCharacterReader(
  deps: Dependencies
): OfflineCharacterReader {
  return {
    async read(params) {
      const [detailResult, inventory, abilities] = await Promise.all([
        loadCharacterDetailUseCase(
          {
            repository: deps.characterDetailRepository,
            rpgAccessRepository: deps.rpgAccessRepository,
            permissionService: deps.characterDetailPermissionService
          },
          params
        ),
        getCharacterInventoryUseCase(
          { repository: deps.characterInventoryRepository },
          params
        ),
        loadCharacterAbilitiesUseCase(
          {
            repository: deps.abilitiesRepository,
            rpgAccessRepository: deps.rpgAccessRepository,
            parserService: deps.abilitiesParserService
          },
          params
        )
      ])

      if (detailResult.status !== "ok") {
        return null
      }

      return {
        id: detailResult.data.characterId,
        name: detailResult.data.displayName,
        image: detailResult.data.image,
        characterType: detailResult.data.characterType,
        classLabel: abilities?.classLabel ?? "Sem classe",
        progressionLevelDisplay: detailResult.data.progressionLevelDisplay,
        progressionCurrent: detailResult.data.progressionCurrent,
        statusEntries: detailResult.data.statusEntries,
        attributeEntries: detailResult.data.attributeEntries,
        skillEntries: detailResult.data.skillEntries,
        inventory: inventory.inventory,
        abilities: abilities?.abilities ?? []
      }
    }
  }
}
