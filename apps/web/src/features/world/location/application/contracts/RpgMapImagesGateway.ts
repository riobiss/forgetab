export interface RpgMapImagesGateway {
  saveMapImage(
    rpgId: string,
    mapId: string,
    mapImage: string | null,
  ): Promise<{ message?: string; mapImage: string | null }>
  uploadMapImage(
    file: File,
    oldUrl?: string | null,
  ): Promise<{ url: string; message?: string }>
  deleteMapImage(url: string): Promise<{ message?: string }>
  uploadSectionImage(
    file: File,
    oldUrl?: string | null,
  ): Promise<{ url: string; message?: string }>
  deleteSectionImage(url: string): Promise<{ message?: string }>
  uploadMarkerImage(
    file: File,
    oldUrl?: string | null,
  ): Promise<{ url: string; message?: string }>
  deleteMarkerImage(url: string): Promise<{ message?: string }>
}
