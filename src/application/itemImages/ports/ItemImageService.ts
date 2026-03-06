export interface ItemImageService {
  uploadItemImage(params: {
    userId: string
    file: File
    oldUrl?: unknown
  }): Promise<{
    url: string
    fileId: string | null
    thumbnailUrl: string | null
  }>
  deleteItemImageByUrl(params: { userId: string; url?: unknown }): Promise<void>
}
