export type ScopedImageFolder =
  | "characters"
  | "items"
  | "library"
  | "maps"
  | "markers"
  | "profiles"
  | "rpgs"
  | "sections"

export interface ScopedImageFile {
  type: string
  size: number
  arrayBuffer(): Promise<ArrayBuffer>
}

export type ScopedImageUploadInput = {
  userId: string
  folder: ScopedImageFolder
  fileName: string
  file: ScopedImageFile
  oldUrl: string | null
}

export type ScopedImageDeleteInput = {
  userId: string
  folder: ScopedImageFolder
  url: string | null
}

export interface ScopedImageService {
  upload(input: ScopedImageUploadInput): Promise<{
    url: string
    fileId: string | null
    thumbnailUrl: string | null
  }>
  deleteByUrl(input: ScopedImageDeleteInput): Promise<void>
}
