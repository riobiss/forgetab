import type { CharactersEditorDependencies } from "@/application/charactersEditor/contracts/CharactersEditorDependencies"
import type { UpdateCharacterPayloadDto, UpsertCharacterPayloadDto } from "@/application/charactersEditor/types"

type Dependencies = CharactersEditorDependencies

export async function loadCharacterEditorBootstrapUseCase(
  deps: Dependencies,
  params: { rpgId: string; includeCharacters?: boolean },
) {
  return deps.gateway.fetchBootstrap(params.rpgId, {
    includeCharacters: params.includeCharacters,
  })
}

export async function createCharacterUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: UpsertCharacterPayloadDto },
) {
  return deps.gateway.createCharacter(params.rpgId, params.payload)
}

export async function loadEditableCharacterUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.fetchCharacter(params.rpgId, params.characterId)
}

export async function updateCharacterUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string; payload: UpdateCharacterPayloadDto },
) {
  return deps.gateway.updateCharacter(params.rpgId, params.characterId, params.payload)
}

export async function deleteCharacterUseCase(
  deps: Dependencies,
  params: { rpgId: string; characterId: string },
) {
  return deps.gateway.deleteCharacter(params.rpgId, params.characterId)
}

export async function uploadCharacterImageUseCase(
  deps: Dependencies,
  params: { file: File },
) {
  return deps.gateway.uploadCharacterImage(params.file)
}

export async function deleteCharacterImageByUrlUseCase(
  deps: Dependencies,
  params: { url: string },
) {
  return deps.gateway.deleteCharacterImageByUrl(params.url)
}
