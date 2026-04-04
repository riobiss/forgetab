import { getRpgAccess } from "./access"
import { createCharacter, CreateCharacterError } from "./createCharacter"
import { listCharacters, ListCharactersError } from "./listCharacters"
import {
  prismaCharacterRepository,
  type CharacterRepository,
} from "./repositories/characterRepository"
import {
  prismaRpgAccessRepository,
  type RpgAccessRepository,
} from "./repositories/rpgAccessRepository"
import {
  prismaRpgTemplatesRepository,
  type RpgTemplatesRepository,
} from "./repositories/rpgTemplatesRepository"
import type { CreateCharacterPayload, RpgAccess } from "./types"

type CharactersDependencies = {
  rpgAccessRepository?: RpgAccessRepository
  characterRepository?: CharacterRepository
  rpgTemplatesRepository?: RpgTemplatesRepository
}

export function createCharactersService(deps: CharactersDependencies = {}) {
  const rpgAccessRepository = deps.rpgAccessRepository ?? prismaRpgAccessRepository
  const characterRepository = deps.characterRepository ?? prismaCharacterRepository
  const rpgTemplatesRepository =
    deps.rpgTemplatesRepository ?? prismaRpgTemplatesRepository

  return {
    getRpgAccess(rpgId: string, userId: string) {
      return getRpgAccess({ rpgId, userId, repository: rpgAccessRepository })
    },

    listCharacters(rpgId: string, userId: string, access: RpgAccess) {
      return listCharacters({ rpgId, userId, access, characterRepository })
    },

    createCharacter(
      rpgId: string,
      userId: string,
      access: RpgAccess,
      payload: CreateCharacterPayload,
    ) {
      return createCharacter({
        rpgId,
        userId,
        access,
        payload,
        characterRepository,
        rpgTemplatesRepository,
      })
    },
  }
}

export const charactersService = createCharactersService()
export { CreateCharacterError, ListCharactersError }
