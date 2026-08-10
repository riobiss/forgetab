export const MAX_IMAGE_FILE_SIZE_BYTES = 8 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp"
] as const

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

export function isAllowedImageMimeType(
  value: string
): value is AllowedImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(
    value.toLowerCase()
  )
}
