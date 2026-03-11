import type { RpgEditorGateway } from "@/application/rpgEditor/contracts/RpgEditorGateway"
import type {
  CreateRpgPayloadDto,
  CreatedRpgDto,
  RpgEditorBootstrapDto,
  RpgEditorCatalogOptionDto,
  RpgEditorIdentityFieldDto,
  RpgEditorTemplateFieldDto,
  UpdateRpgPayloadDto,
} from "@/application/rpgEditor/types"

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new Error(payload.message ?? "Erro na requisicao.")
  }
  return payload
}

export const httpRpgEditorGateway: RpgEditorGateway = {
  async fetchBootstrap(rpgId: string): Promise<RpgEditorBootstrapDto> {
    const [
      rpgPayload,
      attributesPayload,
      statusesPayload,
      skillsPayload,
      racesPayload,
      classesPayload,
      identityPayload,
      characteristicPayload,
    ] = await Promise.all([
      fetch(`/api/rpg/${rpgId}`).then((response) =>
        parseJson<{ rpg?: RpgEditorBootstrapDto["rpg"] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/attributes`).then((response) =>
        parseJson<{ attributes?: RpgEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/statuses`).then((response) =>
        parseJson<{ statuses?: RpgEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/skills`).then((response) =>
        parseJson<{ skills?: RpgEditorTemplateFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/races`).then((response) =>
        parseJson<{ races?: RpgEditorBootstrapDto["races"] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/classes`).then((response) =>
        parseJson<{ classes?: RpgEditorBootstrapDto["classes"] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/character-identity`).then((response) =>
        parseJson<{ fields?: RpgEditorIdentityFieldDto[] }>(response),
      ),
      fetch(`/api/rpg/${rpgId}/character-characteristics`).then((response) =>
        parseJson<{ fields?: RpgEditorIdentityFieldDto[] }>(response),
      ),
    ])

    return {
      rpg: rpgPayload.rpg ?? null,
      attributes: attributesPayload.attributes ?? [],
      statuses: statusesPayload.statuses ?? [],
      skills: skillsPayload.skills ?? [],
      races: racesPayload.races ?? [],
      classes: classesPayload.classes ?? [],
      identityFields: identityPayload.fields ?? [],
      characteristicFields: characteristicPayload.fields ?? [],
    }
  },

  async createRpg(payload: CreateRpgPayloadDto): Promise<CreatedRpgDto> {
    const response = await fetch("/api/rpg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await parseJson<{ rpg?: { id?: string } }>(response)
    const id = result.rpg?.id?.trim()
    if (!id) {
      throw new Error("Nao foi possivel criar o RPG.")
    }

    return { id }
  },

  async updateRpg(rpgId: string, payload: UpdateRpgPayloadDto): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveAttributes(rpgId: string, attributes: RpgEditorTemplateFieldDto[]): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/attributes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributes }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveStatuses(rpgId: string, statuses: RpgEditorTemplateFieldDto[]): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/statuses`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statuses }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveSkills(rpgId: string, skills: string[]): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/skills`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveRaces(rpgId: string, races: RpgEditorCatalogOptionDto[]): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/races`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        races: races.map((item) => ({
          label: item.label,
          category: item.category?.trim() || "geral",
          attributeBonuses: item.attributeBonuses ?? {},
          skillBonuses: item.skillBonuses ?? {},
          lore: item.lore,
          catalogMeta: item.catalogMeta,
        })),
      }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveClasses(rpgId: string, classes: RpgEditorCatalogOptionDto[]): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/classes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classes: classes.map((item) => ({
          label: item.label,
          category: item.category?.trim() || "geral",
          attributeBonuses: item.attributeBonuses ?? {},
          skillBonuses: item.skillBonuses ?? {},
          catalogMeta: item.catalogMeta,
        })),
      }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveCharacterIdentityFields(
    rpgId: string,
    fields: RpgEditorIdentityFieldDto[],
  ): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/character-identity`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: fields.map((item) => ({ label: item.label, required: item.required })),
      }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async saveCharacterCharacteristicFields(
    rpgId: string,
    fields: RpgEditorIdentityFieldDto[],
  ): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}/character-characteristics`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: fields.map((item) => ({ label: item.label, required: item.required })),
      }),
    })

    await parseJson<{ message?: string }>(response)
  },

  async deleteRpg(rpgId: string): Promise<void> {
    const response = await fetch(`/api/rpg/${rpgId}`, {
      method: "DELETE",
    })

    await parseJson<{ message?: string }>(response)
  },

  async uploadRpgImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/uploads/rpg-image", {
      method: "POST",
      body: formData,
    })
    const result = await parseJson<{ url?: string }>(response)
    if (!result.url) {
      throw new Error("Nao foi possivel enviar imagem.")
    }

    return { url: result.url.trim() }
  },

  async deleteRpgImageByUrl(url: string): Promise<void> {
    const response = await fetch("/api/uploads/rpg-image", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })

    await parseJson<{ message?: string }>(response)
  },
}
