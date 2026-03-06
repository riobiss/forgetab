import type { CharactersEditorGateway } from "@/application/charactersEditor/contracts/CharactersEditorGateway"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
  CharacterEditorRpgSettingsDto,
  CharacterEditorTemplateFieldDto,
  UpsertCharacterPayloadDto,
} from "@/application/charactersEditor/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpCharactersEditorGateway: CharactersEditorGateway = {
  async fetchBootstrap(rpgId: string): Promise<CharacterEditorBootstrapDto> {
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
      fetch(`/api/rpg/${rpgId}/attributes`).then((response) =>
        parseJson<{ attributes?: CharacterEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/statuses`).then((response) =>
        parseJson<{ statuses?: CharacterEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/skills`).then((response) =>
        parseJson<{ skills?: CharacterEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/characters`).then((response) =>
        parseJson<{ characters?: CharacterEditorSummaryDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}`).then((response) =>
        parseJson<{ rpg?: CharacterEditorRpgSettingsDto }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/races`).then((response) =>
        parseJson<{ races?: CharacterOptionDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/classes`).then((response) =>
        parseJson<{ classes?: CharacterOptionDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/character-identity`).then((response) =>
        parseJson<{ fields?: CharacterIdentityFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/character-characteristics`).then((response) =>
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

  async updateCharacter(
    rpgId: string,
    characterId: string,
    payload: UpsertCharacterPayloadDto,
  ): Promise<CharacterEditorSummaryDto> {
    const response = await fetch(`/api/rpg/${rpgId}/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result = await parseJson<{ character?: CharacterEditorSummaryDto } & Record<string, unknown>>(
      response,
    )
    return (result.character ?? (result as unknown as CharacterEditorSummaryDto))
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
