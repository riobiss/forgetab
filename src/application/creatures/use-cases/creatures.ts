import type { CreaturesDependencies } from "@/application/creatures/contracts/CreaturesDependencies"
import type {
  CreateCreaturePayloadDto,
  CreatureTemplateCategoryDto,
  UpdateCreaturePayloadDto,
} from "@/application/creatures/types"

type Dependencies = CreaturesDependencies

export function loadCreatureBootstrapUseCase(deps: Dependencies, params: { rpgId: string }) {
  return deps.gateway.fetchBootstrap(params.rpgId)
}

export function loadCreaturesDashboardUseCase(deps: Dependencies, params: { rpgId: string }) {
  return deps.gateway.fetchDashboard(params.rpgId)
}

export function loadCreatureTemplatesUseCase(deps: Dependencies, params: { rpgId: string }) {
  return deps.gateway.fetchTemplates(params.rpgId)
}

export function updateCreatureTemplatesUseCase(
  deps: Dependencies,
  params: { rpgId: string; categories: CreatureTemplateCategoryDto[] },
) {
  return deps.gateway.updateTemplates(params.rpgId, params.categories)
}

export function loadEditableCreatureUseCase(
  deps: Dependencies,
  params: { rpgId: string; creatureId: string },
) {
  return deps.gateway.fetchCreature(params.rpgId, params.creatureId)
}

export function createCreatureUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: CreateCreaturePayloadDto },
) {
  return deps.gateway.createCreature(params.rpgId, params.payload)
}

export function updateCreatureUseCase(
  deps: Dependencies,
  params: { rpgId: string; creatureId: string; payload: UpdateCreaturePayloadDto },
) {
  return deps.gateway.updateCreature(params.rpgId, params.creatureId, params.payload)
}

export function deleteCreatureUseCase(
  deps: Dependencies,
  params: { rpgId: string; creatureId: string },
) {
  return deps.gateway.deleteCreature(params.rpgId, params.creatureId)
}

export function uploadCreatureImageUseCase(deps: Dependencies, params: { file: File }) {
  return deps.gateway.uploadCreatureImage(params.file)
}
