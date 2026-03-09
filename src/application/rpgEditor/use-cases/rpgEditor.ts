import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"
import type {
  CreateRpgPayloadDto,
  RpgEditorIdentityFieldDto,
  RpgEditorTemplateFieldDto,
  UpdateRpgPayloadDto,
} from "@/application/rpgEditor/types"

type Dependencies = RpgEditorDependencies

export async function createRpgUseCase(
  deps: Dependencies,
  params: { payload: CreateRpgPayloadDto },
) {
  return deps.gateway.createRpg(params.payload)
}

export async function loadRpgEditorBootstrapUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.fetchBootstrap(params.rpgId)
}

export async function updateRpgUseCase(
  deps: Dependencies,
  params: { rpgId: string; payload: UpdateRpgPayloadDto },
) {
  return deps.gateway.updateRpg(params.rpgId, params.payload)
}

export async function saveRpgAttributesUseCase(
  deps: Dependencies,
  params: { rpgId: string; attributes: RpgEditorTemplateFieldDto[] },
) {
  return deps.gateway.saveAttributes(params.rpgId, params.attributes)
}

export async function saveRpgStatusesUseCase(
  deps: Dependencies,
  params: { rpgId: string; statuses: RpgEditorTemplateFieldDto[] },
) {
  return deps.gateway.saveStatuses(params.rpgId, params.statuses)
}

export async function saveRpgSkillsUseCase(
  deps: Dependencies,
  params: { rpgId: string; skills: string[] },
) {
  return deps.gateway.saveSkills(params.rpgId, params.skills)
}

export async function saveRpgCharacterIdentityFieldsUseCase(
  deps: Dependencies,
  params: { rpgId: string; fields: RpgEditorIdentityFieldDto[] },
) {
  return deps.gateway.saveCharacterIdentityFields(params.rpgId, params.fields)
}

export async function saveRpgCharacterCharacteristicFieldsUseCase(
  deps: Dependencies,
  params: { rpgId: string; fields: RpgEditorIdentityFieldDto[] },
) {
  return deps.gateway.saveCharacterCharacteristicFields(params.rpgId, params.fields)
}

export async function deleteRpgUseCase(
  deps: Dependencies,
  params: { rpgId: string },
) {
  return deps.gateway.deleteRpg(params.rpgId)
}

export async function uploadRpgImageUseCase(
  deps: Dependencies,
  params: { file: File },
) {
  return deps.gateway.uploadRpgImage(params.file)
}

export async function deleteRpgImageByUrlUseCase(
  deps: Dependencies,
  params: { url: string },
) {
  return deps.gateway.deleteRpgImageByUrl(params.url)
}
