import type { RpgEditorDependencies } from "@/application/rpgEditor/contracts/RpgEditorDependencies"
import type { CreateRpgPayloadDto } from "@/application/rpgEditor/types"

type Dependencies = RpgEditorDependencies

export async function createRpgUseCase(
  deps: Dependencies,
  params: { payload: CreateRpgPayloadDto },
) {
  return deps.gateway.createRpg(params.payload)
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
