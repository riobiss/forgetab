import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto,
} from "@/application/charactersEditor/types"

export interface CharactersEditorGateway {
  fetchBootstrap(
    rpgId: string,
    options?: { includeCharacters?: boolean },
  ): Promise<CharacterEditorBootstrapDto>
  fetchCharacter(rpgId: string, characterId: string): Promise<CharacterEditorSummaryDto>
  createCharacter(rpgId: string, payload: UpsertCharacterPayloadDto): Promise<CharacterEditorSummaryDto>
  updateCharacter(
    rpgId: string,
    characterId: string,
    payload: UpdateCharacterPayloadDto,
  ): Promise<CharacterEditorSummaryDto>
  deleteCharacter(rpgId: string, characterId: string): Promise<void>
  uploadCharacterImage(file: File): Promise<{ url: string }>
  deleteCharacterImageByUrl(url: string): Promise<void>
}
