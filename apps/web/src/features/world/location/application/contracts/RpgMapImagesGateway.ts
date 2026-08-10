import type { UploadImageFile } from "@/features/media/application/types"

export interface RpgMapImagesGateway {
  saveMapImage(
    rpgId: string,
    mapId: string,
    mapImage: string | null
  ): Promise<{ message?: string; mapImage: string | null }>
  uploadMapImage(
    file: UploadImageFile,
    oldUrl?: string | null
  ): Promise<{ url: string; message?: string }>
  deleteMapImage(url: string): Promise<{ message?: string }>
  uploadSectionImage(
    file: UploadImageFile,
    oldUrl?: string | null
  ): Promise<{ url: string; message?: string }>
  deleteSectionImage(url: string): Promise<{ message?: string }>
  uploadMarkerImage(
    file: UploadImageFile,
    oldUrl?: string | null
  ): Promise<{ url: string; message?: string }>
  deleteMarkerImage(url: string): Promise<{ message?: string }>
}
