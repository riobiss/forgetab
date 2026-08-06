import type { CharactersEditorGateway } from "@/features/world/characters/application/editor/contracts/CharactersEditorGateway"
import type {
  CharacterEditorBootstrapDto,
  CharacterEditorSummaryDto,
  CharacterIdentityFieldDto,
  CharacterOptionDto,
  CharacterEditorRpgSettingsDto,
  CharacterEditorTemplateFieldDto,
  UpdateCharacterPayloadDto,
  UpsertCharacterPayloadDto
} from "@forgetab/world-contracts/character-editor"
import { apiFetch } from "@/features/http/infrastructure/apiFetch"
import { parseApiResponse as parseJson } from "@/features/http/infrastructure/parseApiResponse"

async function fetchCharactersList(
  rpgId: string
): Promise<CharacterEditorSummaryDto[]> {
  const payload = await apiFetch(`/api/rpg/${rpgId}/characters`, {
    cache: "no-store"
  }).then((response) =>
    parseJson<{ characters?: CharacterEditorSummaryDto[] }>(response)
  )
  return payload.characters ?? []
}

type MemberUserDto = {
  id: string
  username: string
  name: string
}

function buildAssignablePlayers(params: {
  users: MemberUserDto[]
  characters: CharacterEditorSummaryDto[]
  rpg: CharacterEditorRpgSettingsDto | null
}) {
  if (!params.rpg?.canManage) return []
  const assignedUserIds = new Set(
    params.characters
      .filter(
        (character) =>
          character.characterType === "player" && character.createdByUserId
      )
      .map((character) => character.createdByUserId as string)
  )
  const allowMultiple = Boolean(params.rpg.allowMultiplePlayerCharacters)

  return params.users
    .filter((user) => allowMultiple || !assignedUserIds.has(user.id))
    .map((user) => ({
      userId: user.id,
      username: user.username,
      name: user.name
    }))
}

export const httpCharactersEditorGateway: CharactersEditorGateway = {
  async fetchBootstrap(
    rpgId: string,
    options?: { includeCharacters?: boolean }
  ): Promise<CharacterEditorBootstrapDto> {
    void options
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
      membersPayload
    ] = await Promise.all([
      apiFetch(`/api/rpg/${rpgId}/attributes`, { cache: "no-store" }).then(
        (response) =>
          parseJson<{ attributes?: CharacterEditorTemplateFieldDto[] }>(
            response
          )
      ),
      apiFetch(`/api/rpg/${rpgId}/statuses`, { cache: "no-store" }).then(
        (response) =>
          parseJson<{ statuses?: CharacterEditorTemplateFieldDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/skills`, { cache: "no-store" }).then(
        (response) =>
          parseJson<{ skills?: CharacterEditorTemplateFieldDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/characters`, { cache: "no-store" }).then(
        (response) =>
          parseJson<{ characters?: CharacterEditorSummaryDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}`, { cache: "no-store" }).then((response) =>
        parseJson<{ rpg?: CharacterEditorRpgSettingsDto }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/races`, { cache: "no-store" }).then(
        (response) => parseJson<{ races?: CharacterOptionDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/classes`, { cache: "no-store" }).then(
        (response) => parseJson<{ classes?: CharacterOptionDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/character-identity`, {
        cache: "no-store"
      }).then((response) =>
        parseJson<{ fields?: CharacterIdentityFieldDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/character-characteristics`, {
        cache: "no-store"
      }).then((response) =>
        parseJson<{ fields?: CharacterIdentityFieldDto[] }>(response)
      ),
      apiFetch(`/api/rpg/${rpgId}/members`, { cache: "no-store" })
        .then((response) => parseJson<{ users?: MemberUserDto[] }>(response))
        .catch(() => ({ users: [] as MemberUserDto[] }))
    ])
    const rpg = rpgPayload.rpg ?? null
    const characters = charactersPayload.characters ?? []

    return {
      attributes: attributesPayload.attributes ?? [],
      statuses: statusesPayload.statuses ?? [],
      skills: skillsPayload.skills ?? [],
      characters,
      rpg,
      races: racesPayload.races ?? [],
      classes: classesPayload.classes ?? [],
      identityFields: identityPayload.fields ?? [],
      characteristicFields: characteristicsPayload.fields ?? [],
      assignablePlayers: buildAssignablePlayers({
        users: membersPayload.users ?? [],
        characters,
        rpg
      })
    }
  },

  async createCharacter(
    rpgId: string,
    payload: UpsertCharacterPayloadDto
  ): Promise<CharacterEditorSummaryDto> {
    const response = await apiFetch(`/api/rpg/${rpgId}/characters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    const result = await parseJson<{ character?: CharacterEditorSummaryDto }>(
      response
    )
    if (!result.character) {
      throw new Error("Resposta invalida ao criar personagem.")
    }

    return result.character
  },

  async fetchCharacter(
    rpgId: string,
    characterId: string
  ): Promise<CharacterEditorSummaryDto> {
    const response = await apiFetch(
      `/api/rpg/${rpgId}/characters/${characterId}`,
      {
        cache: "no-store"
      }
    )
    const result = await parseJson<{ character?: CharacterEditorSummaryDto }>(
      response
    )
    if (!result.character) {
      throw new Error("Resposta invalida ao carregar personagem.")
    }

    return result.character
  },

  async updateCharacter(
    rpgId: string,
    characterId: string,
    payload: UpdateCharacterPayloadDto
  ): Promise<CharacterEditorSummaryDto> {
    const response = await apiFetch(
      `/api/rpg/${rpgId}/characters/${characterId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    )
    const result = await parseJson<
      { character?: CharacterEditorSummaryDto } & Record<string, unknown>
    >(response)
    if (result.character) {
      return result.character
    }

    const characters = await fetchCharactersList(rpgId)
    const updatedCharacter = characters.find(
      (character) => character.id === characterId
    )
    if (!updatedCharacter) {
      throw new Error("Nao foi possivel recarregar o personagem atualizado.")
    }

    return updatedCharacter
  },

  async deleteCharacter(rpgId: string, characterId: string): Promise<void> {
    const response = await apiFetch(
      `/api/rpg/${rpgId}/characters/${characterId}`,
      {
        method: "DELETE"
      }
    )
    await parseJson<{ message?: string }>(response)
  },

  async uploadCharacterImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await apiFetch("/api/uploads/character-image", {
      method: "POST",
      body: formData
    })
    const result = await parseJson<{ url?: string }>(response)
    if (!result.url) {
      throw new Error("Nao foi possivel enviar imagem.")
    }
    return { url: result.url.trim() }
  },

  async deleteCharacterImageByUrl(url: string): Promise<void> {
    const response = await apiFetch("/api/uploads/character-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    })
    await parseJson<{ message?: string }>(response)
  }
}
