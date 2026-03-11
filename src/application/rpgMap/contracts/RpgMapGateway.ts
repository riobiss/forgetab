export interface RpgMapGateway {
  saveMapImage(rpgId: string, mapImage: string | null): Promise<{ message?: string; mapImage: string | null }>
  uploadMapImage(file: File, oldUrl?: string | null): Promise<{ url: string; message?: string }>
  deleteMapImage(url: string): Promise<{ message?: string }>
}
