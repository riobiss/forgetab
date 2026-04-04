export type ScopedImageUploadInput = {
  userId: string
  folder: string
  fileName: string
  file: File
  oldUrl?: unknown
}

export type ScopedImageDeleteInput = {
  userId: string
  folder: string
  url?: unknown
}

export interface ScopedImageService {
  upload(input: ScopedImageUploadInput): Promise<{
    url: string
    fileId: string | null
    thumbnailUrl: string | null
  }>
  deleteByUrl(input: ScopedImageDeleteInput): Promise<void>
}
