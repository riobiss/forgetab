import type { CharactersEditorGateway } from "@/application/charactersEditor/contracts/CharactersEditorGateway"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
  CharacterEditorRpgSettingsDto,
  CharacterEditorTemplateFieldDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto,
} from "@/application/charactersEditor/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

async function fetchCharactersList(rpgId: string): Promise<CharacterEditorSummaryDto[]> {
  const payload = await fetch(`/api/rpg/${rpgId}/characters`, { cache: "no-store" }).then((response) =>
    parseJson<{ characters?: CharacterEditorSummaryDto[] }>(response),
  )
  return payload.characters ?? []
}

export const httpCharactersEditorGateway: CharactersEditorGateway = {
  async fetchBootstrap(
    rpgId: string,
    options?: { includeCharacters?: boolean },
  ): Promise<CharacterEditorBootstrapDto> {
    const includeCharacters = options?.includeCharacters ?? true
    const [
      attributesPayload,
      statusesPayload,
      skillsPayload,
      charactersPayload,
      rpgPayload,
      racesPayload,
      classesPayload,
      identityPayload,
      characteristicsPayload,
    ] = await Promise.all([
      fetch(`/api/rpg/${rpgId}/attributes`, { cache: "no-store" }).then((response) =>
        parseJson<{ attributes?: CharacterEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/statuses`, { cache: "no-store" }).then((response) =>
        parseJson<{ statuses?: CharacterEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/skills`, { cache: "no-store" }).then((response) =>
        parseJson<{ skills?: CharacterEditorTemplateFieldDto[] }>(response),
      ),
      includeCharacters
        ? fetch(`/api/rpg/${rpgId}/characters`, { cache: "no-store" }).then((response) =>
            parseJson<{ characters?: CharacterEditorSummaryDto[] }>(response),
          )
        : Promise.resolve({ characters: [] as CharacterEditorSummaryDto[] }),
      fetch(`/api/rpg/${rpgId}`, { cache: "no-store" }).then((response) =>
        parseJson<{ rpg?: CharacterEditorRpgSettingsDto }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/races`, { cache: "no-store" }).then((response) =>
        parseJson<{ races?: CharacterOptionDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/classes`, { cache: "no-store" }).then((response) =>
        parseJson<{ classes?: CharacterOptionDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/character-identity`, { cache: "no-store" }).then((response) =>
        parseJson<{ fields?: CharacterIdentityFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/character-characteristics`, { cache: "no-store" }).then((response) =>
        parseJson<{ fields?: CharacterIdentityFieldDto[] }>(response),
      ),
    ])

    return {
      attributes: attributesPayload.attributes ?? [],
      statuses: statusesPayload.statuses ?? [],
      skills: skillsPayload.skills ?? [],
      characters: charactersPayload.characters ?? [],
      rpg: rpgPayload.rpg ?? null,
      races: racesPayload.races ?? [],
      classes: classesPayload.classes ?? [],
      identityFields: identityPayload.fields ?? [],
      characteristicFields: characteristicsPayload.fields ?? [],
    }
  },

  async createCharacter(
    rpgId: string,
    payload: UpsertCharacterPayloadDto,
  ): Promise<CharacterEditorSummaryDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ character?: CharacterEditorSummaryDto } & Record<string, unknown>>(
      response,
    )
    return (result.character ?? (result as unknown as CharacterEditorSummaryDto))
  },

  async fetchCharacter(rpgId: string, characterId: string): Promise<CharacterEditorSummaryDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}`, {
      cache: "no-store",
    })
    const result = await parseJson<{ character?: CharacterEditorSummaryDto } & Record<string, unknown>>(
      response,
    )
    return (result.character ?? (result as unknown as CharacterEditorSummaryDto))
  },

  async updateCharacter(
    rpgId: string,
    characterId: string,
    payload: UpdateCharacterPayloadDto,
  ): Promise<CharacterEditorSummaryDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ character?: CharacterEditorSummaryDto } & Record<string, unknown>>(
      response,
    )
    if (result.character) {
      return result.character
    }

    const characters = await fetchCharactersList(rpgId)
    const updatedCharacter = characters.find((character) => character.id === characterId)
    if (!updatedCharacter) {
      throw new Error("Nao foi possivel recarregar o personagem atualizado.")
    }

    return updatedCharacter
  },

  async deleteCharacter(rpgId: string, characterId: string): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}`, {
      method: "DELETE",
    })
    await parseJson<{ message?: string }>(response)
  },

  async uploadCharacterImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/uploads/character-image", {
      method: "POST",
      body: formData,
    })
    const result = await parseJson<{ url?: string }>(response)
    if (!result.url) {
      throw new Error("Nao foi possivel enviar imagem.")
    }
    return { url: result.url.trim() }
  },

  async deleteCharacterImageByUrl(url: string): Promise<void> {
    const response = await fetch("/api/uploads/character-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
    await parseJson<{ message?: string }>(response)
  },
}
