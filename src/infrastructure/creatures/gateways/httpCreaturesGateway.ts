import type { CharacterEditorBootstrapDto, CharacterEditorSummaryDto } from "@/application/characters/editor"
import type { CharactersDashboardViewModel } from "@/application/charactersDashboard/types"
import type {
  CreateCreaturePayloadDto,
  CreaturesGateway,
  CreatureTemplateCategoryDto,
  UpdateCreaturePayloadDto,
} from "@/application/creatures"
import { CreatureGatewayError } from "@/application/creatures"
import { httpCharactersEditorGateway } from "@/infrastructure/charactersEditor/gateways/httpCharactersEditorGateway"
import { apiFetch } from "@/infrastructure/http/apiFetch"

export class HttpCreatureError extends CreatureGatewayError {
  constructor(
    message: string,
    status: number,
  ) {
    super(message, status)
    this.name = "HttpCreatureError"
  }
}

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const payload = (await response.json()) as T & { message?: string }
  if (!response.ok) {
    throw new HttpCreatureError(payload.message ?? fallbackMessage, response.status)
  }
  return payload
}

export async function fetchCreaturesDashboardViewModel(rpgId: string) {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/dashboard?type=creature`, {
    cache: "no-store",
    next: { revalidate: 0 },
  })

  return parseJsonResponse<CharactersDashboardViewModel>(
    response,
    "Erro ao carregar criaturas.",
  )
}

export async function fetchCreatureTemplates(rpgId: string) {
  const response = await apiFetch(`/api/rpg/${rpgId}/creature-templates`, {
    cache: "no-store",
    next: { revalidate: 0 },
  })

  const payload = await parseJsonResponse<{ categories?: CreatureTemplateCategoryDto[] }>(
    response,
    "Erro ao carregar configuracao de criaturas.",
  )
  return payload.categories ?? []
}

export async function updateCreatureTemplates(
  rpgId: string,
  categories: CreatureTemplateCategoryDto[],
) {
  const response = await apiFetch(`/api/rpg/${rpgId}/creature-templates`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  })

  return parseJsonResponse<{ message?: string }>(
    response,
    "Erro ao salvar configuracao de criaturas.",
  )
}

export async function fetchCreatureBootstrap(rpgId: string): Promise<CharacterEditorBootstrapDto> {
  const [attributesPayload, statusesPayload, skillsPayload] = await Promise.all([
    apiFetch(`/api/rpg/${rpgId}/attributes`, { cache: "no-store" }).then((response) =>
      parseJsonResponse<{ attributes?: CharacterEditorBootstrapDto["attributes"] }>(
        response,
        "Erro ao carregar atributos.",
      ),
    ),
    apiFetch(`/api/rpg/${rpgId}/statuses`, { cache: "no-store" }).then((response) =>
      parseJsonResponse<{ statuses?: CharacterEditorBootstrapDto["statuses"] }>(
        response,
        "Erro ao carregar status.",
      ),
    ),
    apiFetch(`/api/rpg/${rpgId}/skills`, { cache: "no-store" }).then((response) =>
      parseJsonResponse<{ skills?: CharacterEditorBootstrapDto["skills"] }>(
        response,
        "Erro ao carregar pericias.",
      ),
    ),
  ])

  return {
    attributes: attributesPayload.attributes ?? [],
    statuses: statusesPayload.statuses ?? [],
    skills: skillsPayload.skills ?? [],
    characters: [],
    rpg: null,
    races: [],
    classes: [],
    identityFields: [],
    characteristicFields: [],
  }
}

export async function fetchEditableCreature(
  rpgId: string,
  creatureId: string,
): Promise<CharacterEditorSummaryDto> {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/${creatureId}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  })

  const payload = await parseJsonResponse<{ character?: CharacterEditorSummaryDto }>(
    response,
    "Erro ao carregar criatura.",
  )

  if (!payload.character) {
    throw new HttpCreatureError("Criatura nao encontrada.", 404)
  }

  return payload.character
}

export async function createCreature(
  rpgId: string,
  payload: CreateCreaturePayloadDto,
): Promise<CharacterEditorSummaryDto> {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const result = await parseJsonResponse<{ character?: CharacterEditorSummaryDto }>(
    response,
    "Erro ao criar criatura.",
  )

  if (!result.character) {
    throw new Error("Nao foi possivel carregar a criatura criada.")
  }

  return result.character
}

export async function updateCreature(
  rpgId: string,
  creatureId: string,
  payload: UpdateCreaturePayloadDto,
): Promise<CharacterEditorSummaryDto> {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/${creatureId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const result = await parseJsonResponse<{ character?: CharacterEditorSummaryDto }>(
    response,
    "Erro ao atualizar criatura.",
  )

  if (!result.character) {
    throw new Error("Nao foi possivel carregar a criatura atualizada.")
  }

  return result.character
}

export async function deleteCreature(rpgId: string, creatureId: string) {
  const response = await apiFetch(`/api/rpg/${rpgId}/characters/${creatureId}`, {
    method: "DELETE",
  })

  return parseJsonResponse<{ message?: string }>(response, "Erro ao deletar criatura.")
}

export const httpCreaturesGateway: CreaturesGateway = {
  fetchDashboard: fetchCreaturesDashboardViewModel,
  fetchBootstrap: fetchCreatureBootstrap,
  fetchTemplates: fetchCreatureTemplates,
  updateTemplates: async (rpgId, categories) => {
    await updateCreatureTemplates(rpgId, categories)
  },
  fetchCreature: fetchEditableCreature,
  createCreature,
  updateCreature,
  deleteCreature: async (rpgId, creatureId) => {
    await deleteCreature(rpgId, creatureId)
  },
  uploadCreatureImage: (file) => httpCharactersEditorGateway.uploadCharacterImage(file),
}
