import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  UpsertCharacterPayloadDto,
} from "@/application/charactersEditor/types"

export interface CharactersEditorGateway {
  fetchBootstrap(rpgId: string): Promise<CharacterEditorBootstrapDto>
  createCharacter(rpgId: string, payload: UpsertCharacterPayloadDto): Promise<CharacterEditorSummaryDto>
  updateCharacter(
    rpgId: string,
    characterId: string,
    payload: UpsertCharacterPayloadDto,
  ): Promise<CharacterEditorSummaryDto>
  deleteCharacter(rpgId: string, characterId: string): Promise<void>
  uploadCharacterImage(file: File): Promise<{ url: string }>
  deleteCharacterImageByUrl(url: string): Promise<void>
}
