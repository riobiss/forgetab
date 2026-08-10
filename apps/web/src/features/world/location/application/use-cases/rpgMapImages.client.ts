import type { RpgMapImagesGateway } from "@/features/world/location/application/contracts/RpgMapImagesGateway"
import type { UploadImageFile } from "@/features/media/application/types"

export function persistRpgMapImageUseCase(
  gateway: RpgMapImagesGateway,
  params: { rpgId: string; mapId: string; mapImage: string | null }
) {
  return gateway.saveMapImage(params.rpgId, params.mapId, params.mapImage)
}

export function uploadRpgMapImageUseCase(
  gateway: RpgMapImagesGateway,
  params: { file: UploadImageFile; oldUrl?: string | null }
) {
  return gateway.uploadMapImage(params.file, params.oldUrl)
}

export function deleteRpgMapImageByUrlUseCase(
  gateway: RpgMapImagesGateway,
  params: { url: string }
) {
  return gateway.deleteMapImage(params.url)
}

export function uploadRpgMapSectionImageUseCase(
  gateway: RpgMapImagesGateway,
  params: { file: UploadImageFile; oldUrl?: string | null }
) {
  return gateway.uploadSectionImage(params.file, params.oldUrl)
}

export function deleteRpgMapSectionImageByUrlUseCase(
  gateway: RpgMapImagesGateway,
  params: { url: string }
) {
  return gateway.deleteSectionImage(params.url)
}

export function uploadRpgMapMarkerImageUseCase(
  gateway: RpgMapImagesGateway,
  params: { file: UploadImageFile; oldUrl?: string | null }
) {
  return gateway.uploadMarkerImage(params.file, params.oldUrl)
}

export function deleteRpgMapMarkerImageByUrlUseCase(
  gateway: RpgMapImagesGateway,
  params: { url: string }
) {
  return gateway.deleteMarkerImage(params.url)
}
